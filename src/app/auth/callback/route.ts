import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestUrl.origin;

  try {
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/auth?error=no_code', baseUrl));
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange code for session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.redirect(new URL('/auth?error=auth_failed', baseUrl));
    }

    if (!session?.user) {
      console.error('No user in session after code exchange');
      return NextResponse.redirect(new URL('/auth?error=no_session', baseUrl));
    }

    // Wait a bit to ensure auth is properly set up
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile exists using Prisma
    const existingProfile = await prisma.profile.findUnique({
      where: {
        id: session.user.id
      }
    });

    if (!existingProfile) {
      // Get username from user metadata or email
      const username = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name ||
                      session.user.email?.split('@')[0] || '';

      try {
        // Create profile using Prisma
        await prisma.profile.create({
          data: {
            id: session.user.id,
            username: username,
            role: 'USER',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      } catch (error) {
        console.error('Profile creation error:', error);
        return NextResponse.redirect(new URL('/auth?error=profile_creation_failed', baseUrl));
      }
    }

    // Redirect to the origin URL
    return NextResponse.redirect(new URL('/', baseUrl));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth?error=callback_failed', baseUrl));
  }
} 