import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error('Auth error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { amount, orderId, type } = await request.json();

    // Log the transaction attempt
    console.log('Processing transaction:', {
      userId: session.user.id,
      amount,
      orderId,
      type
    });

    // Check if user exists in profiles
    const userProfile = await prisma.profile.findUnique({
      where: { id: session.user.id }
    });

    if (!userProfile) {
      console.error('User profile not found:', session.user.id);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Update coins and create transaction in a transaction
    const result = await prisma.$transaction([
      prisma.profile.update({
        where: { id: session.user.id },
        data: { coins: { increment: amount } }
      }),
      prisma.coinTransaction.create({
        data: {
          profileId: session.user.id,
          amount,
          type,
          orderId
        }
      })
    ]);

    console.log('Transaction successful:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/coins/add:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 