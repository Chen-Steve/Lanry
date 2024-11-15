import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { UserProfile } from '@/types/database';
import { generateUsername } from '@/utils/username';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    console.error('No code provided in callback');
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_code`);
  }

  try {
    // Exchange the code for a session
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!user) {
      console.error('No user returned from auth exchange');
      throw new Error('No user data available');
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing profile:', profileError);
      throw profileError;
    }

    if (!existingProfile) {
      // Create new profile
      const newProfile: Partial<UserProfile> = {
        id: user.id,
        username: generateUsername(), // Use the utility function to generate username
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_streak: 0,
        last_visit: new Date().toISOString(),
        coins: 0,
        role: 'USER' // Set default role
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (insertError) {
        console.error('Profile creation failed:', insertError);
        throw insertError;
      }
    }

    // Successful auth and profile setup
    return NextResponse.redirect(requestUrl.origin);

  } catch (error) {
    console.error('Callback error:', error);
    
    // Attempt to sign out if there was an error
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Sign out after error failed:', signOutError);
    }

    // Redirect to auth page with error
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(error instanceof Error ? error.message : 'callback_error')}`
    );
  }
} 