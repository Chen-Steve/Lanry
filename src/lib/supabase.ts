/* eslint-disable @typescript-eslint/no-var-requires, import/no-commonjs */
// Universal Supabase helper (no `'use client'` directive)
// It returns a properly configured Supabase client whether the code is
// executed on the server (RSC / API routes) or in the browser.

import type { SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  if (typeof window === 'undefined') {
    // Server-side: create a client that uses the app-router cookie store.
    // We import on demand to keep next/headers out of the client bundle.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs, @typescript-eslint/no-require-imports
    const { createServerClient: createSSRClient } = require('@supabase/ssr');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs, @typescript-eslint/no-require-imports
    const { cookies } = require('next/headers');

    const cookieStore = cookies();
    cached = createSSRClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: {
                maxAge?: number;
                path?: string;
                domain?: string;
                secure?: boolean;
                sameSite?: 'lax' | 'strict' | 'none';
                expires?: Date;
              };
            }[]
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // no-op in RSC
            }
          },
        },
      },
    );
  } else {
    // Client-side: use @supabase/ssr browser client
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs, @typescript-eslint/no-require-imports
    const { createBrowserClient } = require('@supabase/ssr');
    cached = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return cached!;
}
