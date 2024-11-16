'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeAuth = async () => {
      // Check initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Initial Supabase session:', session);
      }
      setSupabaseInitialized(true);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth state changed:', { event, session });
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!supabaseInitialized) {
    return null; // or a loading spinner
  }

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
} 