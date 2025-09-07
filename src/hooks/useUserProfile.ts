import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useSupabase } from '@/app/providers';

interface UserProfile {
  username: string;
  last_visit: string | null;
  coins: number;
  avatar_url?: string;
  role?: 'USER' | 'AUTHOR' | 'TRANSLATOR';
}

export function useUserProfile(userId: string | null) {
  const { user } = useSupabase();
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

      // Fallbacks from auth user metadata to improve first-load UX
      if (!data && !user) return null;

      const fallbackUsername = data?.username || (user?.email ? user.email.split('@')[0] : undefined) || undefined;
      const fallbackAvatar = data?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined) || (user?.user_metadata?.picture as string | undefined) || undefined;

      return data ? { ...data, username: data.username || (fallbackUsername as string), avatar_url: data.avatar_url || fallbackAvatar } : (
        fallbackUsername ? { username: fallbackUsername, last_visit: null, coins: 0, avatar_url: fallbackAvatar, role: undefined } as UserProfile : null
      );
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return { userProfile, isLoading, error };
} 