import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const environment = process.env.NODE_ENV === "production"
  ? new checkoutNodeJssdk.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    )
  : new checkoutNodeJssdk.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );

const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

export async function POST(req: Request) {
  try {
    const { orderId, userId } = await req.json();

    // Verify user exists
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.log("User verification failed:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Capture the PayPal order
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    const response = await client.execute<checkoutNodeJssdk.orders.OrderResult>(request);

    if (response.result.status !== "COMPLETED") {
      throw new Error("Payment not completed");
    }

    const description = response.result.purchase_units[0].description;
    const coins = parseInt(description.split(" ")[0]);

    // Start a transaction to update user's coins and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Add coins to user's balance
      const updatedProfile = await tx.profile.update({
        where: { id: userId },
        data: {
          coins: { increment: coins },
        },
      });

      // Create transaction record
      const transaction = await tx.coinTransaction.create({
        data: {
          profileId: userId,
          amount: coins,
          type: "PURCHASE",
          orderId,
        },
      });

      return { profile: updatedProfile, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to capture payment" },
      { status: 500 }
    );
  }
} 