import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  console.log('[Auth Callback] Starting OAuth callback processing');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      console.log('[Auth Callback] Exchanging code for session');
      await supabase.auth.exchangeCodeForSession(code);
      
      // Get the current session
      console.log('[Auth Callback] Getting session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Auth Callback] Session error:', sessionError);
        return NextResponse.redirect(new URL('/auth?error=session_error', requestUrl.origin));
      }
      
      if (session?.user) {
        console.log('[Auth Callback] User authenticated:', session.user.id);
        console.log('[Auth Callback] User email:', session.user.email);
        console.log('[Auth Callback] Auth provider:', session.user.app_metadata.provider);
        
        // EXPLICITLY create profile here for Google sign-in
        // First check if profile exists
        console.log('[Auth Callback] Checking if profile exists');
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        // If profile doesn't exist or there was an error finding it, create it
        if (!existingProfile) {
          console.log('[Auth Callback] No existing profile found, creating profile for user:', session.user.id);
          
          // Generate username from email or random string
          const username = session.user.email 
            ? session.user.email.split('@')[0] 
            : `user_${Math.random().toString(36).slice(2, 7)}`;
          
          console.log('[Auth Callback] Generated username:', username);
          
          // Create profile
          console.log('[Auth Callback] Inserting profile into database');
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: session.user.id,
              username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              current_streak: 0,
              role: 'USER',
              coins: 0
            }]);

          if (createError) {
            console.error('[Auth Callback] Error creating profile:', createError);
            return NextResponse.redirect(new URL('/auth?error=profile_creation_failed', requestUrl.origin));
          }

          // Create reading time record
          console.log('[Auth Callback] Creating reading time record');
          const { error: readingTimeError } = await supabase
            .from('reading_time')
            .insert([{
              profile_id: session.user.id,
              total_minutes: 0
            }]);

          if (readingTimeError) {
            console.error('[Auth Callback] Error creating reading time:', readingTimeError);
            // Continue anyway since the profile was created
          }
          
          console.log('[Auth Callback] Successfully created profile for:', session.user.id);
        } else {
          console.log('[Auth Callback] Profile already exists for:', session.user.id);
        }
      } else {
        console.log('[Auth Callback] No user in session after authentication');
      }
    } catch (error) {
      console.error('[Auth Callback] Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth?error=auth_error', requestUrl.origin));
    }
  } else {
    console.log('[Auth Callback] No code parameter found in URL');
  }

  console.log('[Auth Callback] Redirecting to home page');
  // Redirect to home page
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 