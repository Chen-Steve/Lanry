import { User } from '@supabase/supabase-js';
import { generateUsername } from './username';
import supabase from '@/lib/supabaseClient';

export async function handleDiscordSignup(user: User) {
  try {
    // First check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // If there's an error other than "not found", throw it
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      throw fetchError;
    }

    // If profile exists, just update last visit
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      return;
    }

    // Generate username for new profile
    const generatedUsername = generateUsername();
    
    // Create profile (matching the regular signup process)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: generatedUsername,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Failed to create user profile');
    }

  } catch (error) {
    console.error('Error in handleDiscordSignup:', error);
    throw error;
  }
} 