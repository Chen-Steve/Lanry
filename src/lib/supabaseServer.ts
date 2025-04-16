import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This is for use in server components
export function createServerClient() {
  return createServerComponentClient({ cookies });
} 