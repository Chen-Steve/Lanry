import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple cache interface
interface CacheEntry {
  country: string;
  expires: number;
}

// In-memory cache with 24-hour expiration
const ipCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function getCountryFromIP(ip: string): Promise<string | null> {
  // Check cache first
  const now = Date.now();
  const cached = ipCache.get(ip);
  
  // Return cached result if still valid
  if (cached && cached.expires > now) {
    return cached.country;
  }
  
  // If not in cache or expired, fetch from API
  try {
    const response = await fetch(`https://get.geojs.io/v1/ip/country/${ip}`);
    const country = await response.text();
    
    // Cache the result
    ipCache.set(ip, {
      country: country.toLowerCase(),
      expires: now + CACHE_DURATION
    });
    
    // Clean up old cache entries periodically
    if (ipCache.size > 10000) { // Prevent unlimited growth
      for (const [key, value] of ipCache.entries()) {
        if (value.expires <= now) {
          ipCache.delete(key);
        }
      }
    }
    
    return country.toLowerCase();
  } catch (error) {
    console.error('IP lookup failed:', error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // Skip blocking for the blocked page itself
  if (req.nextUrl.pathname === '/blocked') {
    return NextResponse.next();
  }

  // Get the real IP address
  const ip = req.ip || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0];
  
  if (ip) {
    const country = await getCountryFromIP(ip);
    
    // Block traffic from China and Korea
    if (country === 'cn' || country === 'kr' || country === 'kp') {
      // Redirect to blocked page instead of JSON response
      return NextResponse.redirect(new URL('/blocked', req.url));
    }
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh the session
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|novel-covers|public).*)',
    '/api/:path*',
  ],
};