import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ensures a profile exists for the given user ID
 * @param supabase Supabase client instance
 * @param userId User ID to ensure profile for
 * @param email Optional email to use for username generation
 * @returns Object containing success status and message
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
  email?: string
) {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    // If profile exists, return success
    if (existingProfile) {
      return { 
        success: true, 
        message: 'Profile already exists',
        profileId: existingProfile.id
      };
    }
    
    // Generate username from email or random string
    const username = email 
      ? email.split('@')[0] 
      : `user_${Math.random().toString(36).slice(2, 7)}`;
    
    // Create profile
    const { error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_streak: 0,
        role: 'USER',
        coins: 0
      }]);

    if (createError) {
      console.error('[Ensure Profile] Error creating profile:', createError);
      return { 
        success: false, 
        message: 'Failed to create profile',
        error: createError
      };
    }

    // Create reading time record
    const { error: readingTimeError } = await supabase
      .from('reading_time')
      .insert([{
        profile_id: userId,
        total_minutes: 0
      }]);

    if (readingTimeError) {
      console.error('[Ensure Profile] Error creating reading time:', readingTimeError);
      // Continue anyway since the profile was created
    }
    
    console.log('[Ensure Profile] Successfully created profile for:', userId);
    
    return { 
      success: true, 
      message: 'Profile created successfully',
      profileId: userId
    };
  } catch (error) {
    console.error('[Ensure Profile] Unexpected error:', error);
    return { 
      success: false, 
      message: 'Unexpected error',
      error
    };
  }
} 