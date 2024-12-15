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
    //console.log('5a. Starting processPayment');
    
    const customId = event.resource.purchase_units[0]?.custom_id;
    //console.log('5b. Custom ID:', customId);
    
    if (!customId) {
      throw new Error('No custom ID found in payment');
    }

    const [userId, packageId] = customId.split(':');
    //console.log('5c. Parsed IDs:', { userId, packageId });

    const coinPackage = coinPackages.find(pkg => pkg.id === parseInt(packageId));
    //console.log('5d. Coin package:', coinPackage);

    if (!coinPackage) {
      throw new Error('Invalid package ID');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        coins: supabase.rpc('add_coins', {
          coin_amount: coinPackage.coins,
          user_id: userId
        }),
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)
      .select('coins');

    //console.log('5e. Profile update result:', { data: profileData, error: profileError });

    if (profileError) {
      throw profileError;
    }

    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        profileId: userId,
        amount: coinPackage.coins,
        type: 'PURCHASE',
        orderId: orderId
      });

    //console.log('5f. Transaction recording result:', { error: transactionError });

    if (transactionError) {
      throw transactionError;
    }

  } catch (error) {
    //console.error('ProcessPayment error:', error);
    //console.error('Full error details:', JSON.stringify(error, null, 2));
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

const coinPackages = [
  { id: 1, coins: 10, price: 1 },
  { id: 2, coins: 50, price: 5, popular: true },
  { id: 3, coins: 100, price: 10 },
  { id: 4, coins: 200, price: 20 },
];

export async function POST(req: Request) {
  try {
    //console.log('1. Received PayPal webhook request');
    
    // Clone the request to read it twice
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    //console.log('2. Webhook raw body:', rawBody);
    
    const isValid = await verifyPayPalWebhook(req);
    //console.log('3. Webhook verification status:', isValid);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event: PayPalWebhookEvent = JSON.parse(rawBody);
    //console.log('4. Parsed webhook event:', {
    //  eventType: event.event_type,
    //  orderId: event.resource.id,
    //  purchaseUnits: event.resource.purchase_units
    //});

    const eventType = event.event_type;
    const orderId = event.resource.id;

    // Handle different PayPal webhook events
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        //console.log('5. Starting payment processing');
        await processPayment(orderId, event);
        //console.log('6. Payment processed successfully');
        break;
      
      case 'PAYMENT.CAPTURE.PENDING':
        await markTransactionStatus(orderId, 'PENDING');
        //console.log('Payment pending:', event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await markTransactionStatus(orderId, 'FAILED');
        //console.log('Payment failed:', event);
        break;
      
      case 'PAYMENT.CAPTURE.REVERSED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await markTransactionStatus(orderId, 'REFUNDED');
        // You might want to implement coin removal logic here
        //console.log('Payment refunded:', event);
        break;

      default:
        //console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Log the full error object
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error },
      { status: 500 }
    );
  }
} 