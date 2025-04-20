import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create server client with cookies (needed for auth-helpers-nextjs)
    const supabaseServer = createServerComponentClient({ cookies });
    
    // Try to get server time from Supabase using the server client
    const { data: serverTime, error } = await supabaseServer.rpc('get_server_time');
    
    // If there's an error with the RPC call or the function doesn't exist,
    // fallback to using the server's time directly
    if (error) {
      console.error('Error getting server time from RPC:', error);
      
      // Use Node.js server time as fallback
      const currentServerTime = new Date().toISOString();
      return NextResponse.json({ serverTime: currentServerTime });
    }

    return NextResponse.json({ serverTime });
  } catch (error) {
    console.error('Server time fetch error:', error);
    
    // Even in case of an exception, return the server time instead of an error
    const fallbackServerTime = new Date().toISOString();
    return NextResponse.json({ serverTime: fallbackServerTime });
  }
} 