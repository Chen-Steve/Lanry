import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { calculateStreak, updateStreakInDb } from '@/utils/streakUtils';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
}

export function useStreak(userId: string | null) {
  const [streakUpdatedToday, setStreakUpdatedToday] = useState(false);
  const queryClient = useQueryClient();

  // Query for user profile including streak data
  const { data: userProfile } = useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, current_streak, last_visit, coins')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Mutation for updating streak
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !userProfile) throw new Error('No user ID or profile');

      const { newStreak, shouldUpdate } = calculateStreak(
        userProfile.last_visit, 
        userProfile.current_streak
      );

      if (!shouldUpdate) return null;

      return await updateStreakInDb(supabase, userId, newStreak);
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['profile', userId], data);
        toast.success('Streak updated successfully!');
      }
    },
    onError: (error) => {
      console.error('Error updating streak:', error);
      toast.error('Failed to update streak. Please refresh the page.');
    },
    retry: false,
  });

  // Update streak when needed
  useEffect(() => {
    if (userId && userProfile && !streakUpdatedToday) {
      const { shouldUpdate } = calculateStreak(
        userProfile.last_visit, 
        userProfile.current_streak
      );
      
      if (shouldUpdate) {
        updateStreakMutation.mutate();
        setStreakUpdatedToday(true);
      }
    }
  }, [userId, userProfile, streakUpdatedToday, updateStreakMutation]);

  // Reset the flag when the user ID changes
  useEffect(() => {
    setStreakUpdatedToday(false);
  }, [userId]);

  return { userProfile };
} 