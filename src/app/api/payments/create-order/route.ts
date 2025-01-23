import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize PayPal environment
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

export async function POST(req: Request) {
  try {
    const { userId, coins, amount } = await req.json();

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

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toString(),
          },
          description: `${coins} Coins Purchase`,
        },
      ],
    });

    const order = await client.execute(request);
    
    const result = order.result as { id: string };
    if (!result.id) {
      throw new Error("No order ID returned from PayPal");
    }

    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
} 