'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import supabase from '@/lib/supabaseClient';
import { ServerTimeProvider } from '@/providers/ServerTimeProvider';

interface SupabaseContext {
  supabase: SupabaseClient;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SupabaseContext = createContext<SupabaseContext>({
  supabase,
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export const useSupabase = () => useContext(SupabaseContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }));

  // Render immediately; don't gate the entire app behind an auth fetch
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Refresh user when tab regains focus/visibility or network reconnects
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      setIsAuthenticated(!!user);
    } catch (e) {
      console.error('Auth refresh failed:', e);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        // Get the initial authenticated user (validated by Supabase Auth server)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error.message);
          // Don't throw on auth errors, just log them
        }
        setUser(user ?? null);
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Set loading to false even on error to prevent infinite loading
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        timeoutCleared = true;
        setIsLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading states
    let timeoutCleared = false;
    const timeoutId = setTimeout(() => {
      if (isLoading && !timeoutCleared) {
        console.warn('Auth initialization timed out, proceeding without auth');
        setIsLoading(false);
        // Don't clear user state on timeout - just stop loading
      }
    }, 15000); // 15 second timeout

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      try {
        // Always re-fetch the user from Auth server instead of trusting the session param
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth state change user fetch error:', error.message);
        }
        setUser(user ?? null);
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshUser();
      }
    };
    const onFocus = () => void refreshUser();
    const onOnline = () => void refreshUser();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [refreshUser]);

  const paypalClientId = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;

  if (!paypalClientId) {
    console.error('PayPal Client ID is not configured');
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not configured');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Configuration Error
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300">
            The application is not properly configured. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  // Base PayPal configuration - individual components will override specific options as needed
  const paypalInitialOptions = {
    clientId: paypalClientId!,
    currency: "USD",
    components: "buttons,marks",
    vault: true,
    intent: "subscription",
    enableFunding: ["paypal"],
    disableFunding: ["credit", "card"],
    debug: process.env.NODE_ENV !== 'production',
  };

  // Always render children; downstream consumers can use isLoading to gate UX

  return (
    <>
      <PayPalScriptProvider options={paypalInitialOptions}>
        <SupabaseContext.Provider value={{ 
          supabase, 
          user, 
          isLoading,
          isAuthenticated 
        }}>
          <QueryClientProvider client={queryClient}>
            <ServerTimeProvider>
              {children}
            </ServerTimeProvider>
          </QueryClientProvider>
        </SupabaseContext.Provider>
      </PayPalScriptProvider>
    </>
  );
} 