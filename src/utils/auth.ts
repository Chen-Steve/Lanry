import { User } from '@supabase/supabase-js';
import { generateUsername } from './username';
import supabase from '@/lib/supabaseClient';

export async function handleDiscordSignup(user: User) {
  if (!user?.id) {
    throw new Error('Invalid user data');
  }

  try {
    const generatedUsername = generateUsername();
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: generatedUsername,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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