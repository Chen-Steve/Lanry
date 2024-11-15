import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      throw new Error('No code provided');
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the auth code for a session
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) throw exchangeError;
    if (!session?.user) throw new Error('No user in session');

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();

    // Only throw error if it's not a "not found" error
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      throw profileCheckError;
    }

    // Create profile if it doesn't exist
    if (!existingProfile) {
      const discordUsername = session.user.user_metadata?.preferred_username || 
                            session.user.user_metadata?.full_name ||
                            session.user.user_metadata?.name ||
                            `User${Math.random().toString(36).slice(2, 7)}`;

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          username: discordUsername,
          role: 'USER',
          current_streak: 1,
          coins: 0,
          last_visit: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    }

    // Successful authentication, redirect to home page
    return NextResponse.redirect(new URL('/', requestUrl.origin));

  } catch (error) {
    console.error('Auth callback error:', error);
    // Redirect to auth page with error message
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`,
        request.url
      )
    );
  }
} 