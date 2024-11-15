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

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching profile:', fetchError);
      throw fetchError;
    }

    if (existingProfile) return;

    // Get username from Discord metadata or generate one
    const discordUsername = user.user_metadata?.full_name || 
                          user.user_metadata?.name ||
                          generateUsername();

    const now = new Date().toISOString();
    
    // Create new profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: discordUsername,
          created_at: now,
          updated_at: now,
          last_visit: now,
          role: 'USER',
          current_streak: 0,
          coins: 0
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Failed to create user profile');
    }

    // Update last visit
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ last_visit: now })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating last visit:', updateError);
      // Non-critical error, don't throw
    }

  } catch (error) {
    console.error('Discord signup error:', error);
    throw error;
  }
} 