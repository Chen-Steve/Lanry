import { User } from '@supabase/supabase-js';
import { generateUsername } from './username';
import supabase from '@/lib/supabaseClient';

export async function handleDiscordSignup(user: User) {
  console.log('Discord signup user data:', {
    supabaseId: user.id,
    email: user.email,
    discordData: user.user_metadata
  });

  if (!user.id) {
    throw new Error('No Supabase user ID provided');
  }

  try {
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: generateUsername(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', {
        error: profileError,
        userId: user.id
      });
      throw profileError;
    }

    return newProfile;
  } catch (error) {
    console.error('Failed to create profile:', error);
    throw error;
  }
} 