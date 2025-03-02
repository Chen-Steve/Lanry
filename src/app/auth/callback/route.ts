import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Auth Callback] Session error:', sessionError);
        return NextResponse.redirect(new URL('/auth?error=session_error', requestUrl.origin));
      }
      
      if (session?.user) {
        console.log('[Auth Callback] User authenticated:', session.user.id);
        
        // Always ensure profile exists - check first
        const { error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        // If profile doesn't exist, create it
        if (profileCheckError && profileCheckError.code === 'PGRST116') {
          console.log('[Auth Callback] Creating profile for user:', session.user.id);
          
          // Create profile
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: session.user.id,
              username: session.user.email?.split('@')[0] || `user_${Math.random().toString(36).slice(2, 7)}`,
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
      }
    } catch (error) {
      console.error('[Auth Callback] Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth?error=auth_error', requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 