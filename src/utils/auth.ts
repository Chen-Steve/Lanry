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

    // If profile exists, just return
    if (existingProfile) {
      // Update last visit
      await supabase
        .from('profiles')
        .update({ last_visit: new Date().toISOString() })
        .eq('id', user.id);
      return;
    }

    // Get username from Discord metadata or generate one
    const discordUsername = user.user_metadata?.full_name || 
                          user.user_metadata?.name ||
                          generateUsername();

    const now = new Date().toISOString();
    
    // Create new profile with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const { error: insertError } = await supabase
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

        if (!insertError) {
          break; // Success, exit loop
        }

        // If username conflict, generate a new one and retry
        if (insertError.code === '23505') { // Unique constraint violation
          retryCount++;
          continue;
        }

        throw insertError; // Other errors
      } catch (error) {
        console.error('Profile creation attempt failed:', error);
        retryCount++;
        if (retryCount === maxRetries) {
          throw new Error('Failed to create user profile after multiple attempts');
        }
        // Wait briefly before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.error('Discord signup error:', error);
    throw error;
  }
} 