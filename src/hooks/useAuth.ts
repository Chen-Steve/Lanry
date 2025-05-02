import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/providers';

export function useAuth() {
  const { user, isAuthenticated, isLoading, supabase } = useSupabase();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Clear stored session data
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      queryClient.clear();
      router.push('/auth');
      router.refresh();

    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
      queryClient.clear();
      router.push('/auth');
    }
  };

  return {
    isAuthenticated,
    userId: user?.id || null,
    isLoading,
    handleSignOut
  };
} 