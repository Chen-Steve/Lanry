import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { userId, subscriptionId, membershipTierId } = await req.json();

    // Create supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate subscription dates (default to 1 month)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create or update subscription record
    const subscription = await prisma.subscription.upsert({
      where: {
        profileId: userId,
      },
      update: {
        paypalSubscriptionId: subscriptionId,
        status: "ACTIVE",
        startDate,
        endDate,
        latestBillingDate: startDate,
        cancelledAt: null,
      },
      create: {
        profileId: userId,
        paypalSubscriptionId: subscriptionId,
        status: "ACTIVE",
        startDate,
        endDate,
        latestBillingDate: startDate,
      },
    });

    // Record the subscription transaction
    const transaction = await prisma.subscriptionTransaction.create({
      data: {
        subscriptionId: subscription.id,
        profileId: userId,
        paypalSubscriptionId: subscriptionId,
        type: "SUBSCRIPTION_START",
        amount: getMembershipAmount(membershipTierId),
      },
    });

    return NextResponse.json({ 
      success: true, 
      subscription,
      transaction
    });
  } catch (error) {
    console.error("Error recording subscription:", error);
    return NextResponse.json(
      { error: "Failed to record subscription" },
      { status: 500 }
    );
  }
}

// Helper function to get the amount based on membership tier ID
function getMembershipAmount(tierIdAsNumber: number): number {
  switch (tierIdAsNumber) {
    case 1: // Supporter
      return 5;
    case 2: // Patron
      return 9;
    case 3: // VIP
      return 19;
    default:
      return 0;
  }
} 