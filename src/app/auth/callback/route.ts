import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('No user in session');

      // Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        throw profileCheckError;
      }

      // If no profile exists, create one with Discord metadata
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
            avatar_url: session.user.user_metadata?.avatar_url,
            discord_id: session.user.user_metadata?.provider_id,
            role: 'USER',
            current_streak: 0,
            coins: 0,
            last_visit: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    return NextResponse.redirect(new URL('/auth?error=No code provided', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
} 