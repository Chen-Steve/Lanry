import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getMembershipTierFromAmount(amount: number): number {
  if (amount === 19.99) return 3; // VIP
  if (amount === 9.99) return 2;  // Premium
  if (amount === 4.99) return 1;  // Supporter
  return 0; // Unknown/No subscription
}

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

    // Get the latest transaction amount to determine tier
    const latestTransaction = subscription.transactions[0];
    const membershipTierId = latestTransaction 
      ? getMembershipTierFromAmount(Number(latestTransaction.amount))
      : 0;

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      plan: subscription.paypalSubscriptionId,
      membershipTierId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      latestBillingDate: subscription.latestBillingDate,
      cancelledAt: subscription.cancelledAt,
      latestBillingAmount: latestTransaction ? Number(latestTransaction.amount) : undefined,
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