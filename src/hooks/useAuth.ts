import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('[Init] Error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setIsAuthenticated(false);
      } else if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    // console.log('Sign out initiated');
    try {
      // Clear stored session data
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }

      await supabase.auth.signOut();
      
      setIsAuthenticated(false);
      setUserId(null);
      queryClient.clear();

      setTimeout(() => {
        window.location.href = '/';
      }, 100);

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
      window.location.href = '/';
    }
  };

  return {
    isAuthenticated,
    userId,
    isLoading,
    handleSignOut
  };
} 