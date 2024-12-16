import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { calculateStreak, updateStreakInDb } from '@/utils/streakUtils';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
  avatar_url?: string;
}

export function useStreak(userId: string | null, checkStreak: boolean = false) {
  const queryClient = useQueryClient();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateAttemptRef = useRef<Date>();

  // Query for user profile including streak data
  const { data: userProfile } = useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, current_streak, last_visit, coins, avatar_url')
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
        // Only show toast on significant streak updates
        if (data.current_streak > (userProfile?.current_streak || 0)) {
          toast.success(`Streak updated! Current streak: ${data.current_streak} days`);
        }
      }
    },
    onError: (error) => {
      console.error('Error updating streak:', error);
      toast.error('Failed to update streak');
    },
    retry: false,
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Update streak only when checkStreak is true
  useEffect(() => {
    if (checkStreak && userId && userProfile) {
      // Prevent multiple updates within 5 minutes
      const now = new Date();
      if (lastUpdateAttemptRef.current && 
          now.getTime() - lastUpdateAttemptRef.current.getTime() < 5 * 60 * 1000) {
        return;
      }

      // Clear any existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Debounce the update
      updateTimeoutRef.current = setTimeout(() => {
        const { shouldUpdate } = calculateStreak(
          userProfile.last_visit, 
          userProfile.current_streak
        );
        
        if (shouldUpdate) {
          lastUpdateAttemptRef.current = new Date();
          updateStreakMutation.mutate();
        }
      }, 1000);
    }
  }, [checkStreak, userId, userProfile, updateStreakMutation]);

  return { userProfile };
} 