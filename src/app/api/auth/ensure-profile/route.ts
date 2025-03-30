import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('[Ensure Profile] Session error:', sessionError);
    return NextResponse.json({ error: 'Session error' }, { status: 401 });
  }
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();
    
    // If profile exists, return success
    if (existingProfile) {
      return NextResponse.json({ 
        success: true, 
        message: 'Profile already exists',
        profileId: existingProfile.id
      });
    }
    
    // If profile doesn't exist, create it
    if (profileCheckError && profileCheckError.code === 'PGRST116') {
      console.log('[Ensure Profile] Creating profile for user:', session.user.id);
      
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
        console.error('[Ensure Profile] Error creating profile:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      
      console.log('[Ensure Profile] Successfully created profile for:', session.user.id);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profile created successfully',
        profileId: session.user.id
      });
    } else {
      // Some other error occurred during profile check
      return NextResponse.json({ error: 'Error checking profile' }, { status: 500 });
    }
  } catch (error) {
    console.error('[Ensure Profile] Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
} 