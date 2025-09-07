import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { generateUsername } from '@/utils/username';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    // no-op response; we don't need to mutate cookies manually in this handler
    const supabase = await createServerClient();
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
      
      // Fetch authenticated user from Supabase Auth server
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        return NextResponse.redirect(new URL('/auth?error=user_error', requestUrl.origin));
      }
      
      if (user) {
        
        try {
          const userId = user.id;
          const emailLocal = user.email ? user.email.split('@')[0] : undefined;
          const suggestedUsername = emailLocal ?? generateUsername();
          const deterministicSuffix = userId.replace(/-/g, '').slice(0, 6);
          const deterministicUsername = suggestedUsername
            ? `${suggestedUsername}-${deterministicSuffix}`
            : `user-${deterministicSuffix}`;
          const avatarUrl = (user.user_metadata?.avatar_url
            || user.user_metadata?.picture
            || null) as string | null;

          // Check if profile exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', userId)
            .maybeSingle();

          if (fetchError) {
            return NextResponse.redirect(new URL('/auth?error=profile_fetch_failed', requestUrl.origin));
          }

          if (!existingProfile) {
            // Insert a new profile (do not overwrite coins or role later)
            // Handle unique username collisions by retrying with a random username.
            // Try email-based username; on collision, try deterministic suffix; final fallback: random
            const finalUsername = suggestedUsername || deterministicUsername;
            let insertError: { code?: string } | null = null;
            const candidateUsernames = [
              finalUsername,
              deterministicUsername,
              generateUsername(),
            ];

            for (const candidate of candidateUsernames) {
              const { error } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: userId,
                    username: candidate,
                    avatar_url: avatarUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    role: 'USER',
                    coins: 0,
                  },
                ]);
              if (!error) {
                insertError = null;
                break;
              }
              insertError = error as { code?: string };
              if (insertError.code !== '23505') break;
            }

            if (insertError) {
              return NextResponse.redirect(new URL('/auth?error=profile_creation_failed', requestUrl.origin));
            }
          } else {
            // Update only missing fields (do not reset coins or role)
            const updates: Record<string, unknown> = {};
            const needsUsername = !existingProfile.username && !!suggestedUsername;
            if (needsUsername) {
              updates.username = suggestedUsername;
            }
            if (!existingProfile.avatar_url && avatarUrl) {
              updates.avatar_url = avatarUrl;
            }
            if (Object.keys(updates).length > 0) {
              updates.updated_at = new Date().toISOString();
              // Attempt update; if username collision occurs, retry with random username once
              let { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);
              if (updateError && (updateError as { code?: string }).code === '23505' && needsUsername) {
                const retryUpdates = { ...updates, username: deterministicUsername };
                ({ error: updateError } = await supabase
                  .from('profiles')
                  .update(retryUpdates)
                  .eq('id', userId));
              }
              if (updateError) {
                console.error('[Auth Callback] Error updating profile:', updateError);
                return NextResponse.redirect(new URL('/auth?error=profile_update_failed', requestUrl.origin));
              }
            }
          }
          
          console.log('[Auth Callback] Redirecting to home');
          return NextResponse.redirect(new URL('/', requestUrl.origin));
          
        } catch (error) {
          console.error('[Auth Callback] Error handling profile:', error);
          return NextResponse.redirect(new URL('/auth?error=profile_error', requestUrl.origin));
        }
      } else {
        console.error('[Auth Callback] No user after authentication');
        return NextResponse.redirect(new URL('/auth?error=no_user', requestUrl.origin));
      }
    } catch (error) {
      console.error('[Auth Callback] Error processing callback:', error);
      return NextResponse.redirect(new URL('/auth?error=callback_error', requestUrl.origin));
    }
  }

  // Something went wrong, redirect to auth page
  console.error('[Auth Callback] No code parameter found in URL');
  return NextResponse.redirect(new URL('/auth?error=no_code', requestUrl.origin));
} 