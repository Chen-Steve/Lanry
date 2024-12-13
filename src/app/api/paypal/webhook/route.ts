import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_SANDBOX_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;

interface PayPalPurchaseUnit {
  custom_id?: string;
  amount: {
    currency_code: string;
    value: string;
  };
}

interface PayPalResource {
  id: string;
  status: string;
  purchase_units: PayPalPurchaseUnit[];
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: PayPalResource;
  create_time: string;
  resource_type: string;
}

async function verifyPayPalWebhook(req: Request) {
  try {
    const webhookBody = await req.text();
    const webhookHeaders = {
      'PAYPAL-AUTH-ALGO': req.headers.get('paypal-auth-algo'),
      'PAYPAL-CERT-URL': req.headers.get('paypal-cert-url'),
      'PAYPAL-TRANSMISSION-ID': req.headers.get('paypal-transmission-id'),
      'PAYPAL-TRANSMISSION-SIG': req.headers.get('paypal-transmission-sig'),
      'PAYPAL-TRANSMISSION-TIME': req.headers.get('paypal-transmission-time'),
    };

    const verificationResponse = await fetch(
      `https://api-m.paypal.com/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: JSON.stringify({
          auth_algo: webhookHeaders['PAYPAL-AUTH-ALGO'],
          cert_url: webhookHeaders['PAYPAL-CERT-URL'],
          transmission_id: webhookHeaders['PAYPAL-TRANSMISSION-ID'],
          transmission_sig: webhookHeaders['PAYPAL-TRANSMISSION-SIG'],
          transmission_time: webhookHeaders['PAYPAL-TRANSMISSION-TIME'],
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(webhookBody),
        }),
      }
    );

    const verification = await verificationResponse.json();
    return verification.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

async function processPayment(orderId: string, event: PayPalWebhookEvent) {
  try {
    // Get custom data from the payment
    const customId = event.resource.purchase_units[0]?.custom_id;
    if (!customId) {
      console.error('No custom ID found in payment');
      throw new Error('No custom ID found in payment');
    }

    const [userId, packageId] = customId.split(':');
    console.log('Processing payment for:', { userId, packageId, orderId });

    const { data: coinPackage, error: fetchError } = await supabase
      .from('coin_packages')
      .select('coins')
      .eq('id', packageId)
      .single();

    if (fetchError || !coinPackage) {
      console.error('Error fetching coin package:', fetchError);
      throw new Error('Invalid package ID');
    }

    console.log('Found coin package:', coinPackage);

    // Update user's coin balance
    const { error: transactionError } = await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: coinPackage.coins,
      type: 'PURCHASE',
      payment_id: orderId,
      status: 'COMPLETED',
    });

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      throw transactionError;
    }

    console.log('Transaction recorded successfully');

    // Update user's total coins using the correct function name
    const { error: updateError } = await supabase.rpc('add_coins', {
      coin_amount: coinPackage.coins,
      user_id: userId
    });

    if (updateError) {
      console.error('Error updating user coins:', updateError);
      throw updateError;
    }

    console.log('Coins updated successfully');
  } catch (error) {
    console.error('Error in processPayment:', error);
    throw error;
  }
}

async function markTransactionStatus(orderId: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED') {
  const { error } = await supabase
    .from('coin_transactions')
    .update({ status })
    .eq('payment_id', orderId);

  if (error) {
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    console.log('Received PayPal webhook');
    
    const isValid = await verifyPayPalWebhook(req);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event: PayPalWebhookEvent = await req.json();
    const eventType = event.event_type;
    const orderId = event.resource.id;

    console.log('Processing webhook event:', { eventType, orderId });

    // Handle different PayPal webhook events
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await processPayment(orderId, event);
        console.log('Payment processed successfully');
        break;
      
      case 'PAYMENT.CAPTURE.PENDING':
        await markTransactionStatus(orderId, 'PENDING');
        console.log('Payment pending:', event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await markTransactionStatus(orderId, 'FAILED');
        console.log('Payment failed:', event);
        break;
      
      case 'PAYMENT.CAPTURE.REVERSED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await markTransactionStatus(orderId, 'REFUNDED');
        // You might want to implement coin removal logic here
        console.log('Payment refunded:', event);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 