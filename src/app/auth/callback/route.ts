import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      throw new Error('No code provided');
    }

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      throw new Error('No user in session');
    }

    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      throw profileCheckError;
    }

    // If no profile exists, create one
    if (!existingProfile) {
      const discordUsername = session.user.user_metadata?.full_name || 
                            session.user.user_metadata?.name ||
                            session.user.user_metadata?.preferred_username ||
                            `User${Math.random().toString(36).slice(2, 7)}`;

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          username: discordUsername,
          current_streak: 0,
          role: 'USER',
          coins: 0,
          last_visit: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Profile creation error:', insertError);
        throw insertError;
      }
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    console.error('Final error:', error);
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
} 