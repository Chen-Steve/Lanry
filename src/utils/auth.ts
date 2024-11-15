import { User } from '@supabase/supabase-js';
import { generateUsername } from './username';
import supabase from '@/lib/supabaseClient';

export async function handleDiscordSignup(user: User) {
  // First log the incoming user data
  console.log('Starting Discord signup with user:', {
    id: user?.id,
    email: user?.email,
    isValid: !!user?.id
  });

  if (!user?.id) {
    console.error('No user ID provided to handleDiscordSignup');
    throw new Error('Invalid user data');
  }

  try {
    // Log the attempt to fetch profile
    console.log('Attempting to fetch profile for user ID:', user.id);
    
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, current_streak, last_visit, coins')
      .eq('id', user.id)
      .single();

    // More detailed logging of the profile check
    console.log('Profile check complete:', { 
      exists: !!existingProfile,
      error: fetchError?.message,
      errorCode: fetchError?.code 
    });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      throw fetchError;
    }

    const now = new Date().toISOString();

    if (existingProfile) {
      console.log('Updating existing profile for user:', user.id);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          last_visit: now,
          updated_at: now
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
      return;
    } else {
      // Log attempt to create new profile
      console.log('Attempting to create new profile...');
      
      const generatedUsername = generateUsername();
      console.log('Generated username:', generatedUsername);

      // Create new profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: generatedUsername,
            current_streak: 0,
            last_visit: now,
            coins: 0,
            created_at: now,
            updated_at: now,
            role: 'USER'
          }
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details
        });
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('Successfully created new profile:', newProfile);
    }

  } catch (error) {
    console.error('Error in handleDiscordSignup:', error);
    throw error;
  }
} 