import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Try to get server time from Supabase
    const { data: serverTime, error } = await supabase.rpc('get_server_time');
    
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