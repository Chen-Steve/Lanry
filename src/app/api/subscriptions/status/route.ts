import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Find the user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { profileId: userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 5, // last 5 transactions for context
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ hasSubscription: false });
    }

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      plan: subscription.paypalSubscriptionId, // or add planId if you store it
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      latestBillingDate: subscription.latestBillingDate,
      cancelledAt: subscription.cancelledAt,
      transactions: subscription.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 });
  }
} 