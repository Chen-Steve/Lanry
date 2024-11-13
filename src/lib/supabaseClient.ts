import { createClient } from '@supabase/supabase-js';
import { AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Add debug options
    debug: process.env.NODE_ENV === 'development',
  }
});

// Add debug listener only once
if (process.env.NODE_ENV !== 'production') {
  let isListenerAttached = false;
  
  if (!isListenerAttached) {
    supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      console.log('[Supabase Debug] Auth State Change:', {
        event,
        userId: session?.user?.id,
        timestamp: new Date().toISOString(),
      });

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
      }
    });
    isListenerAttached = true;
  }
}

export default supabase;