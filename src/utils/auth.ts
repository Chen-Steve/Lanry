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

    const now = new Date().toISOString();

    // If profile exists, just update last visit
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          last_visit: now,
          updated_at: now
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      return;
    }

    // Generate username for new profile
    const generatedUsername = generateUsername();
    
    // Create profile with all fields that are being queried
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: generatedUsername,
          current_streak: 0,
          last_visit: now,
          coins: 0,
          created_at: now,
          updated_at: now
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