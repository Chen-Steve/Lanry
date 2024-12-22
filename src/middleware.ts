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
    console.log(`[IP Block] Using cached country for IP ${ip}: ${cached.country}`);
    return cached.country;
  }
  
  // If not in cache or expired, fetch from API
  try {
    console.log(`[IP Block] Fetching country for IP ${ip}`);
    const response = await fetch(`https://get.geojs.io/v1/ip/country/${ip}`);
    const responseText = await response.text();
    
    // Add validation and detailed logging
    console.log(`[IP Block] Raw API response for IP ${ip}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    });

    // Validate the country code format
    const country = responseText.trim();
    if (!country || country.length !== 2) {
      console.error(`[IP Block] Invalid country code received: "${country}"`);
      return null;
    }

    const countryLower = country.toLowerCase();
    console.log(`[IP Block] Processed country code for IP ${ip}: ${countryLower}`);
    
    // Cache the result
    ipCache.set(ip, {
      country: countryLower,
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
    
    return countryLower;
  } catch (error) {
    console.error('[IP Block] IP lookup failed:', error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // Skip blocking for the blocked page itself
  if (req.nextUrl.pathname === '/blocked') {
    return NextResponse.next();
  }

  // Get the real IP address and log all headers for debugging
  const ip = req.ip || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0];
  console.log('[IP Block] Request headers:', Object.fromEntries(req.headers.entries()));
  
  if (ip) {
    console.log(`[IP Block] Processing request from IP: ${ip}`);
    const country = await getCountryFromIP(ip);
    console.log(`[IP Block] Final resolved country code: ${country}`);
    
    // Block traffic from China and Korea
    if (country === 'cn' || country === 'kr' || country === 'kp') {
      console.log(`[IP Block] Blocking access from country: ${country}`);
      // Redirect to blocked page instead of JSON response
      return NextResponse.redirect(new URL('/blocked', req.url));
    }
  } else {
    console.log('[IP Block] No IP address found in request');
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