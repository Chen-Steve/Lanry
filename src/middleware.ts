import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Check country restriction first
  const country = req.geo?.country;
  if (["CN", "KR"].includes(country ?? "")) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // This call is crucial for maintaining auth state and cookies
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: [
    // Only run middleware on routes that require authentication
    '/user-dashboard/:path*',
    '/shop/:path*',
    '/author/:path*',
    // '/forum/:path*',
  ],
};
