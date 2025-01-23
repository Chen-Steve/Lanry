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
      process.env.PAYPAL_SANDBOX_CLIENT_ID!,
      process.env.PAYPAL_SANDBOX_CLIENT_SECRET!
    );

const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

interface PayPalCaptureResult {
  id: string;
  status: string;
  purchase_units: Array<{
    payments: {
      captures: Array<{
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}

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
    const response = await client.execute<PayPalCaptureResult>(request);

    console.log("PayPal response:", JSON.stringify(response.result, null, 2)); // Debug log

    if (response.result.status !== "COMPLETED") {
      throw new Error("Payment not completed");
    }

    // Get the amount from the capture response
    const result = response.result as PayPalCaptureResult;
    const amount = parseFloat(result.purchase_units[0].payments.captures[0].amount.value);
    // Calculate coins based on amount (matching our packages)
    const coins = amount === 1 ? 10 :
                 amount === 5 ? 50 :
                 amount === 10 ? 100 :
                 amount === 20 ? 200 : 0;

    if (coins === 0) {
      throw new Error("Invalid payment amount");
    }

    // Start a transaction to update user's coins and create transaction record
    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: {
        coins: { increment: coins },
      },
    });

    // Create transaction record
    const transaction = await prisma.coinTransaction.create({
      data: {
        profileId: userId,
        amount: coins,
        type: "PURCHASE",
        orderId,
      },
    });

    return NextResponse.json({ profile: updatedProfile, transaction });
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to capture payment" },
      { status: 500 }
    );
  }
} 