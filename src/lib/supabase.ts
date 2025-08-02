/* eslint-disable @typescript-eslint/no-var-requires, import/no-commonjs */
// Universal Supabase helper (no `'use client'` directive)
// It returns a properly configured Supabase client whether the code is
// executed on the server (RSC / API routes) or in the browser.

import type { SupabaseClient } from '@supabase/supabase-js';

// We intentionally **do not** import next/headers or auth-helpers at the
// top-level, because whichever branch is not needed must be tree-shaken
// out of the bundle.  Requiring them only inside the conditional keeps
// the client and server bundles clean.

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
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {
            /* no-op on the server */
          },
          remove() {
            /* no-op */
          },
        },
      },
    );
  } else {
    // Client-side: use the Next.js auth helper that syncs auth automatically.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs, @typescript-eslint/no-require-imports
    const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');
    cached = createClientComponentClient();
  }

  return cached!;
}
