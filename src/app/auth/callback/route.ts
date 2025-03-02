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
        // Profile creation will be handled by the auth state change handler
      }
    } catch (error) {
      console.error('[Auth Callback] Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth?error=auth_error', requestUrl.origin));
    }
  }

  // Redirect to home page
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 