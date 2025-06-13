import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure this module is safe to import in client bundles: we only access
// secret env vars and create the admin client when running on the server.

let supabaseAdmin: SupabaseClient | null = null;

if (typeof window === 'undefined') {
  // Server-side: verify env vars and create client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export default supabaseAdmin as unknown as SupabaseClient; 