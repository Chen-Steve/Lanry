import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';

interface UserProfile {
  username: string;
  last_visit: string | null;
  coins: number;
  avatar_url?: string;
  role?: 'USER' | 'AUTHOR' | 'TRANSLATOR';
}

export function useUserProfile(userId: string | null) {
  const { data: userProfile, isLoading, error } = useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, last_visit, coins, avatar_url, role')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return { userProfile, isLoading, error };
} 