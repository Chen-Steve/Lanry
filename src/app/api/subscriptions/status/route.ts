import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Subscriptions not implemented yet: always report no subscription
    return NextResponse.json({ hasSubscription: false });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 });
  }
} 