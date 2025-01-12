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
  // Get user's local timezone date
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: userTz }));
  
  if (!lastVisit) {
    return {
      newStreak: 1,
      shouldUpdate: true,
      lastVisitDate: today.toISOString()
    };
  }

  // Convert last visit to user's timezone
  const lastVisitDate = new Date(new Date(lastVisit).toLocaleString('en-US', { timeZone: userTz }));
  
  // Get dates without time components in user's timezone
  const lastVisitDay = new Date(
    lastVisitDate.getFullYear(),
    lastVisitDate.getMonth(),
    lastVisitDate.getDate()
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  
  const diffTime = todayDay.getTime() - lastVisitDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // If last visit was today, never update
  if (diffDays === 0) {
    return {
      newStreak: currentStreak,
      shouldUpdate: false,
      lastVisitDate: lastVisit // Keep existing timestamp
    };
  } 
  // If last visit was yesterday, increment streak
  else if (diffDays === 1) {
    return {
      newStreak: currentStreak + 1,
      shouldUpdate: true,
      lastVisitDate: today.toISOString()
    };
  } 
  // If more than 1 day has passed, reset streak
  else {
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