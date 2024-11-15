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

    // Get the session directly instead of exchanging code
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session?.user) {
      throw new Error('No user in session');
    }

    const user = session.user;

    // If this is a Discord user, handle profile creation
    if (user.app_metadata.provider === 'discord') {
      try {
        // Check if profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          throw profileCheckError;
        }

        if (!existingProfile) {
          // Get Discord username from user metadata
          const discordUsername = user.user_metadata?.preferred_username || // Discord specific
                                user.user_metadata?.full_name ||
                                user.user_metadata?.name ||
                                user.user_metadata?.user_name ||
                                `User${Math.random().toString(36).slice(2, 7)}`;

          console.log('Creating profile with username:', discordUsername);
          console.log('User metadata:', user.user_metadata);

          // Create new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
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
        console.error('Profile handling error:', error);
        throw error;
      }
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin));

  } catch (error) {
    console.error('Final error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/auth?error=true&message=${encodeURIComponent(errorMessage)}`, request.url));
  }
} 