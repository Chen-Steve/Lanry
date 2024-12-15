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
}

export const calculateStreak = (lastVisit: string | null, currentStreak: number = 0): StreakUpdate => {
  const today = new Date();
  
  if (!lastVisit) {
    return {
      newStreak: 1,
      shouldUpdate: true
    };
  }

  const lastVisitDate = new Date(lastVisit);
  
  // Get dates in UTC without time components for day comparison
  const lastVisitDay = new Date(Date.UTC(
    lastVisitDate.getUTCFullYear(), 
    lastVisitDate.getUTCMonth(), 
    lastVisitDate.getUTCDate()
  ));
  const todayDay = new Date(Date.UTC(
    today.getUTCFullYear(), 
    today.getUTCMonth(), 
    today.getUTCDate()
  ));
  
  const diffTime = todayDay.getTime() - lastVisitDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // If last visit was today, never update
  if (diffDays === 0) {
    return {
      newStreak: currentStreak,
      shouldUpdate: false
    };
  } 
  // If last visit was yesterday, increment streak
  else if (diffDays === 1) {
    return {
      newStreak: currentStreak + 1,
      shouldUpdate: true
    };
  } 
  // If more than 1 day has passed, reset streak
  else {
    return {
      newStreak: 1,
      shouldUpdate: true
    };
  }
};

export const updateStreakInDb = async (
  supabase: SupabaseClient,
  userId: string,
  newStreak: number
): Promise<Profile> => {
  const today = new Date();
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: Error | unknown;

  while (retryCount < maxRetries) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          last_visit: today.toISOString(),
          updated_at: today.toISOString()
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