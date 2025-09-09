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

  const paypalClientId = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;

  if (!paypalClientId) {
    console.error('PayPal Client ID is not configured');
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        // Get the initial authenticated user (validated by Supabase Auth server)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error.message);
        }
        setUser(user ?? null);
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      // Always re-fetch the user from Auth server instead of trusting the session param
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth state change user fetch error:', error.message);
      }
      setUser(user ?? null);
      setIsAuthenticated(!!user);
    });

    return () => subscription.unsubscribe();
  }, []);

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