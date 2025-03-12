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
        
        try {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();
          
          if (!existingProfile) {
            console.log('[Auth Callback] No existing profile found, attempting to create profile');
            
            try {
              // Generate username from email or random string
              const username = session.user.email 
                ? session.user.email.split('@')[0] 
                : `user_${Math.random().toString(36).slice(2, 7)}`;
              
              // Create profile
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
                // If profile creation fails, redirect to create-profile page
                return NextResponse.redirect(new URL('/auth/create-profile', requestUrl.origin));
              } else {
                // Try to create reading time record
                try {
                  const readingTimeId = crypto.randomUUID();
                  const { error: readingTimeError } = await supabase
                    .from('reading_time')
                    .insert([{
                      id: readingTimeId,
                      profile_id: session.user.id,
                      total_minutes: 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }]);
                  
                  if (readingTimeError) {
                    console.error('[Auth Callback] Error creating reading time:', readingTimeError);
                  } else {
                    console.log('[Auth Callback] Profile and reading time created successfully');
                  }
                } catch (readingTimeError) {
                  console.error('[Auth Callback] Exception creating reading time:', readingTimeError);
                }
                
                // If profile was created successfully, redirect to home
                console.log('[Auth Callback] Redirecting to home after successful profile creation');
                return NextResponse.redirect(new URL('/', requestUrl.origin));
              }
            } catch (profileError) {
              console.error('[Auth Callback] Exception creating profile:', profileError);
              return NextResponse.redirect(new URL('/auth/create-profile', requestUrl.origin));
            }
          } else {
            console.log('[Auth Callback] Profile already exists for user:', session.user.id);
            // If profile exists, redirect to home
            return NextResponse.redirect(new URL('/', requestUrl.origin));
          }
        } catch (checkError) {
          console.error('[Auth Callback] Error checking for existing profile:', checkError);
        }
      } else {
        console.error('[Auth Callback] No user in session after authentication');
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