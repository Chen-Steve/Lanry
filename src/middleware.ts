import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get country from Vercel's geolocation headers
  const country = request.geo?.country || 'XX';

  // Block access from Korea (KR)
  if (country === 'KR') {
    return NextResponse.redirect(new URL('/blocked', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. /blocked (blocking page itself)
     * 5. favicon.ico, etc
     */
    '/((?!api|_next|static|blocked|favicon.ico).*)',
  ],
};