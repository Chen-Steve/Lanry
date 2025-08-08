'use client';

import { createBrowserClient } from '@supabase/ssr';

// This client is for Client Components and uses @supabase/ssr's browser client
// to keep session cookies in sync with the app-router middleware.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabase;