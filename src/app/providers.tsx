'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
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

  const [supabaseInitialized, setSupabaseInitialized] = useState(false);
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
        // Get the initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
        setSupabaseInitialized(true);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!supabaseInitialized) {
    return null;
  }

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