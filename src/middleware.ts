import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Check country restriction first
  const country = req.geo?.country;
  if (["CN", "KR"].includes(country ?? "")) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired and retrieve it
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
