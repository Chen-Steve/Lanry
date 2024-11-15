import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Delete the cookies after use
  cookieStore.delete('discord_oauth_state');
  cookieStore.delete('discord_code_verifier');

  return NextResponse.redirect(requestUrl.origin, {
    status: 301,
  });
} 