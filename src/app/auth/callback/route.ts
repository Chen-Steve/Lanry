import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { handleDiscordSignup } from '@/utils/auth';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    
    // Get the stored state from cookies
    const cookieStore = cookies();
    const storedState = cookieStore.get('discord_oauth_state')?.value;
    
    // Verify state matches to prevent CSRF attacks
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=invalid_state`,
        { status: 301 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    if (code) {
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) throw authError;
      
      // If we have a user, handle the profile creation
      if (user) {
        await handleDiscordSignup(user);
      }
    }

    // Delete the cookies after use
    cookieStore.delete('discord_oauth_state');
    cookieStore.delete('discord_code_verifier');

    return NextResponse.redirect(requestUrl.origin, {
      status: 301,
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=callback_error`,
      { status: 301 }
    );
  }
} 