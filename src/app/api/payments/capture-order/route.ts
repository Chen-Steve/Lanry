import { NextResponse } from "next/server";
import { randomUUID } from 'crypto';
import supabaseAdmin from '@/lib/supabaseAdmin';
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

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

    // Verify user exists and fetch current coins
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, coins')
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
    const coins = amount === 2 ? 20 :
                 amount === 5 ? 50 :
                 amount === 10 ? 100 :
                 amount === 20 ? 200 :
                 amount === 25 ? 300 :
                 amount === 50 ? 600 :
                 amount === 100 ? 1300 : 0;

    if (coins === 0) {
      throw new Error("Invalid payment amount");
    }

    // First, create transaction record (only existing columns)
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('coin_transactions')
      .insert({
        id: randomUUID(),
        profile_id: userId,
        amount: coins,
        type: 'PURCHASE',
        order_id: orderId,
      })
      .select('*')
      .single();

    if (insertError || !transaction) {
      throw insertError ?? new Error('Failed to record coin transaction');
    }

    // Then update user's coins
    const newCoinBalance = (user.coins ?? 0) + coins;
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ coins: newCoinBalance })
      .eq('id', userId)
      .select('id, coins')
      .single();

    if (updateError || !updatedProfile) {
      throw updateError ?? new Error('Failed to update profile coins');
    }

    return NextResponse.json({ profile: updatedProfile, transaction });
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to capture payment" },
      { status: 500 }
    );
  }
} 