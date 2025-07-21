import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Shared helper to obtain a typed Supabase client inside server contexts (API routes & RSC)
export function createServerClient() {
  const cookieStore = cookies();

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          /* no-op: Readonly cookies cannot be modified in this context */
        },
        remove() {
          /* no-op */
        }
      }
    }
  );
} 