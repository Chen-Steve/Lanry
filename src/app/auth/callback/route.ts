import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=no_code', requestUrl.origin));
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);

    // Get the user after successful sign in
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return NextResponse.redirect(new URL('/auth?error=user_fetch_failed', requestUrl.origin));
    }

    // Check if profile exists using Prisma
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    });

    if (!existingProfile) {
      // Get username from user metadata or email
      const username = user.user_metadata?.full_name || 
                      user.user_metadata?.name ||
                      user.email?.split('@')[0] || '';

      try {
        // Create profile using Prisma
        await prisma.profile.create({
          data: {
            id: user.id,
            username: username,
            currentStreak: 0,
            lastVisit: new Date(),
            role: 'USER',
            coins: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            avatarUrl: user.user_metadata?.avatar_url || null,
            kofiUrl: null,
            patreonUrl: null,
            customUrl: null,
            customUrlLabel: null
          }
        });
      } catch (error) {
        console.error('Profile creation error:', error);
        return NextResponse.redirect(new URL('/auth?error=profile_creation_failed', requestUrl.origin));
      }
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth?error=callback_failed', requestUrl.origin));
  }
} 