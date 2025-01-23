'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Analytics } from '@vercel/analytics/react';

interface SupabaseContext {
  supabase: SupabaseClient;
  user: User | null;
}

const SupabaseContext = createContext<SupabaseContext | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

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
  const supabase = createClientComponentClient();

  const paypalClientId = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;

  if (!paypalClientId) {
    console.error('PayPal Client ID is not configured');
  }

  const paypalInitialOptions = {
    clientId: paypalClientId!,
    currency: "USD",
    intent: "capture",
    "enable-funding": "paypal",
    "disable-funding": "credit,card",
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          return;
        }

        // If session exists but is expired, try to refresh it
        if (session?.expires_at && session.expires_at <= Math.floor(Date.now() / 1000)) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Error refreshing session:', refreshError.message);
          } else if (refreshedSession) {
            setUser(refreshedSession.user);
          }
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setSupabaseInitialized(true);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!supabaseInitialized) {
    return null; // or a loading spinner
  }

  return (
    <>
      <Analytics />
      <PayPalScriptProvider options={paypalInitialOptions}>
        <SupabaseContext.Provider value={{ supabase, user }}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SupabaseContext.Provider>
      </PayPalScriptProvider>
    </>
  );
} 