import { User } from '@supabase/supabase-js';
import { generateUsername } from './username';
import supabase from '@/lib/supabaseClient';

export async function handleDiscordSignup(user: User) {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) return;

    // Get Discord username from user metadata
    const discordUsername = user.user_metadata?.full_name || 
                          user.user_metadata?.name ||
                          generateUsername();

    // Create new profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: discordUsername,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'USER',
          current_streak: 0,
          coins: 0
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Failed to create user profile');
    }
  } catch (error) {
    console.error('Discord signup error:', error);
    throw error;
  }
} 