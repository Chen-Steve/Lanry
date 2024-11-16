import type { NextRequest } from 'next/server';
import { middleware as authMiddleware } from './auth';
import { middleware as superAdminMiddleware } from './superAdmin';

export async function middleware(request: NextRequest) {
  // Check if the request is for the admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return superAdminMiddleware(request);
  }
  
  // For all other routes, use the auth middleware
  return authMiddleware(request);
}

// Combine matchers from both middleware
export const config = {
  matcher: [
    // Auth middleware matchers
    '/((?!_next/static|_next/image|favicon.ico|public|api/public).*)',
    // Super admin middleware matchers
    '/admin/:path*',
  ],
}; 