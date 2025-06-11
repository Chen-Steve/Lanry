import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simply return the current server time; no Supabase interaction required.
    const currentServerTime = new Date().toISOString();
    return NextResponse.json({ serverTime: currentServerTime });
  } catch (error) {
    console.error('Server time fetch error:', error);
    // Even in case of an unexpected exception, attempt to return a fallback time.
    const fallbackServerTime = new Date().toISOString();
    return NextResponse.json({ serverTime: fallbackServerTime });
  }
} 