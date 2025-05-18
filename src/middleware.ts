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

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Check if the user is authenticated
  const { data: { session } } = await supabase.auth.getSession();

  // If user is authenticated, ensure they have a profile
  if (session?.user) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();

    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log('[Middleware] Creating profile for user:', session.user.id);
      
      // Create profile
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: session.user.id,
          username: session.user.email?.split('@')[0] || `user_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          current_streak: 0,
          role: 'USER',
          coins: 0
        }]);

      if (createError) {
        console.error('[Middleware] Error creating profile:', createError);
      } else {
        // Create reading time record
        const { error: readingTimeError } = await supabase
          .from('reading_time')
          .insert([{
            profile_id: session.user.id,
            total_minutes: 0
          }]);

        if (readingTimeError) {
          console.error('[Middleware] Error creating reading time:', readingTimeError);
        } else {
          console.log('[Middleware] Successfully created profile for:', session.user.id);
        }
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth (auth pages)
     * - api (API routes)
     * - .css, .js, .png, .jpg, .jpeg, .gif, .svg, .ico, .webp, .avif (common asset types)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth|api/|.*\.(?:css|js|png|jpg|jpeg|gif|svg|ico|webp|avif)).*)',
  ],
};