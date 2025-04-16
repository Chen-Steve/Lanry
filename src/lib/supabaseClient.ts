'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This version of the client is specifically for client components
// It handles auth state synchronization with the server
const supabase = createClientComponentClient();

export default supabase;