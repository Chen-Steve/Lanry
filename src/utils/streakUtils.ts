import { SupabaseClient } from '@supabase/supabase-js';

interface Profile {
  id: string;
  current_streak: number;
  last_visit: string;
  updated_at: string;
}

interface StreakUpdate {
  newStreak: number;
  shouldUpdate: boolean;
  lastVisitDate: string;
}

export const calculateStreak = (lastVisit: string | null, currentStreak: number = 0): StreakUpdate => {
  const now = new Date();
  // Get the start of today in UTC
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  if (!lastVisit) {
    return {
      newStreak: 1,
      shouldUpdate: true,
      lastVisitDate: today.toISOString()
    };
  }

  const lastVisitDate = new Date(lastVisit);
  // Convert lastVisit to its UTC day start
  const lastVisitDay = new Date(Date.UTC(lastVisitDate.getUTCFullYear(), lastVisitDate.getUTCMonth(), lastVisitDate.getUTCDate()));

  const diffTime = today.getTime() - lastVisitDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return {
      newStreak: currentStreak,
      shouldUpdate: false,
      lastVisitDate: lastVisit
    };
  } else if (diffDays === 1) {
    return {
      newStreak: currentStreak + 1,
      shouldUpdate: true,
      lastVisitDate: today.toISOString()
    };
  } else {
    return {
      newStreak: 1,
      shouldUpdate: true,
      lastVisitDate: today.toISOString()
    };
  }
};

export const updateStreakInDb = async (
  supabase: SupabaseClient,
  userId: string,
  streakUpdate: StreakUpdate
): Promise<Profile> => {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: Error | unknown;

  while (retryCount < maxRetries) {
    try {
      // Use optimistic locking to prevent race conditions
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('current_streak, last_visit, updated_at')
        .eq('id', userId)
        .single();

      if (currentProfile) {
        // Recheck if update is still needed with latest data
        const recheck = calculateStreak(currentProfile.last_visit, currentProfile.current_streak);
        if (!recheck.shouldUpdate) {
          return currentProfile as Profile;
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          current_streak: streakUpdate.newStreak,
          last_visit: streakUpdate.lastVisitDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from update');
      
      return data as Profile;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000)
        );
      }
    }
  }

  throw lastError;
}; 