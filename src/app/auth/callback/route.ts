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
            console.log('[Auth Callback] No existing profile found, creating profile');
            
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
                role: 'USER',
                coins: 0
              }]);
            
            if (createError) {
              console.error('[Auth Callback] Error creating profile:', createError);
              return NextResponse.redirect(new URL('/auth?error=profile_creation_failed', requestUrl.origin));
            }
          }
          
          console.log('[Auth Callback] Redirecting to home');
          return NextResponse.redirect(new URL('/', requestUrl.origin));
          
        } catch (error) {
          console.error('[Auth Callback] Error handling profile:', error);
          return NextResponse.redirect(new URL('/auth?error=profile_error', requestUrl.origin));
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