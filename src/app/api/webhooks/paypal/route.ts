import { NextResponse } from "next/server";
import supabaseAdmin from '@/lib/supabaseAdmin';
import { randomUUID } from 'crypto';

// PayPal event types for subscriptions
const SUBSCRIPTION_CREATED = 'BILLING.SUBSCRIPTION.CREATED';
const SUBSCRIPTION_UPDATED = 'BILLING.SUBSCRIPTION.UPDATED';
const SUBSCRIPTION_CANCELLED = 'BILLING.SUBSCRIPTION.CANCELLED';
const PAYMENT_SALE_COMPLETED = 'PAYMENT.SALE.COMPLETED';

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status?: string;
    plan_id?: string;
    subscriber?: {
      payer_id: string;
    };
    billing_agreement_id?: string;
    amount?: {
      total: string;
      currency: string;
    };
    billing_info?: {
      next_billing_time?: string;
      last_payment?: {
        amount?: {
          value: string;
        };
      };
    };
    start_time?: string;
    update_time?: string;
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paypal-transmission-sig');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    if (!signature || !webhookId) {
      console.error('Missing webhook signature or ID');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Verify webhook signature (in a production app)
    // This is a simplification - in production, follow PayPal's verification approach
    // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
    
    const payload = JSON.parse(body) as PayPalWebhookEvent;
    const eventType = payload.event_type;
    
    // Log event for debugging
    console.log(`PayPal Webhook: ${eventType}`, JSON.stringify(payload, null, 2));
    
    switch (eventType) {
      case SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(payload);
        break;
      case SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(payload);
        break;
      case SUBSCRIPTION_CANCELLED:
        await handleSubscriptionCancelled(payload);
        break;
      case PAYMENT_SALE_COMPLETED:
        await handleSubscriptionPayment(payload);
        break;
      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(payload: PayPalWebhookEvent) {
  const subscriptionId = payload.resource.id;
  const planId = payload.resource.plan_id;
  const status = payload.resource.status;
  
  console.log(`Subscription created: ${subscriptionId} for plan ${planId}, status: ${status}`);
  
  // Note: We can't automatically associate this with a user in the webhook
  // This is typically handled when the user returns to the site (in the record endpoint)
}

async function handleSubscriptionUpdated(payload: PayPalWebhookEvent) {
  const subscriptionId = payload.resource.id;
  const status = payload.resource.status;
  const updateTime = payload.resource.update_time ? new Date(payload.resource.update_time) : new Date();
  
  console.log(`Subscription updated: ${subscriptionId}, new status: ${status}`);
  
  try {
    // Find the subscription by PayPal subscription ID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('paypal_subscription_id', subscriptionId)
      .maybeSingle();
    if (subError) throw subError;
    
    if (!subscription) {
      console.log(`No subscription found for PayPal ID: ${subscriptionId}`);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: status || 'ACTIVE',
        updated_at: updateTime.toISOString(),
      })
      .eq('id', subscription.id);
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionCancelled(payload: PayPalWebhookEvent) {
  const subscriptionId = payload.resource.id;
  const updateTime = payload.resource.update_time ? new Date(payload.resource.update_time) : new Date();
  
  console.log(`Subscription cancelled: ${subscriptionId}`);
  
  try {
    // Find the subscription by PayPal subscription ID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, profile_id, paypal_subscription_id')
      .eq('paypal_subscription_id', subscriptionId)
      .maybeSingle();
    if (subError) throw subError;
    
    if (!subscription) {
      console.log(`No subscription found for PayPal ID: ${subscriptionId}`);
      return;
    }

    // Update subscription as cancelled
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: updateTime.toISOString(),
        updated_at: updateTime.toISOString(),
      })
      .eq('id', subscription.id);
    if (updateError) throw updateError;
    
    // Record the cancellation transaction
    const { error: txnError } = await supabaseAdmin
      .from('subscription_transactions')
      .insert({
        subscription_id: subscription.id,
        profile_id: subscription.profile_id,
        paypal_subscription_id: subscription.paypal_subscription_id,
        type: 'CANCELLATION',
        amount: 0,
      });
    if (txnError) throw txnError;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
}

async function handleSubscriptionPayment(payload: PayPalWebhookEvent) {
  const subscriptionId = payload.resource.billing_agreement_id;
  if (!subscriptionId) {
    // Not a subscription payment
    return;
  }
  
  const amount = payload.resource.amount?.total;
  const currency = payload.resource.amount?.currency;
  const paymentDate = new Date();
  const amountValue = amount ? parseFloat(amount) : 0;
  
  console.log(`Subscription payment received: ${amount} ${currency} for subscription ${subscriptionId}`);
  
  try {
    // Find the subscription by PayPal subscription ID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, profile_id')
      .eq('paypal_subscription_id', subscriptionId)
      .maybeSingle();
    if (subError) throw subError;
    
    if (!subscription) {
      console.log(`No subscription found for PayPal ID: ${subscriptionId}`);
      return;
    }

    // Calculate next billing date (1 month from now)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    // Update subscription with new billing date and end date
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        latest_billing_date: paymentDate.toISOString(),
        end_date: nextBillingDate.toISOString(),
        status: 'ACTIVE',
      })
      .eq('id', subscription.id);
    if (updateError) throw updateError;
    
    // Record the renewal transaction
    const { error: renewalTxnError } = await supabaseAdmin
      .from('subscription_transactions')
      .insert({
        subscription_id: subscription.id,
        profile_id: subscription.profile_id,
        paypal_subscription_id: subscriptionId,
        type: 'RENEWAL',
        amount: amountValue,
      });
    if (renewalTxnError) throw renewalTxnError;
    
    // Determine monthly bonus coins; currently a flat 55 coins per renewal
    const bonusCoins = 55;
    
    if (bonusCoins > 0) {
      // Award the bonus coins to the user
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('coins')
        .eq('id', subscription.profile_id)
        .single();
      if (profileError) throw profileError;

      const newCoins = (profile?.coins ?? 0) + bonusCoins;
      const { error: coinsUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', subscription.profile_id);
      if (coinsUpdateError) throw coinsUpdateError;
      
      // Record the coin transaction
      const { error: coinTxnError } = await supabaseAdmin
        .from('coin_transactions')
      .insert({
        id: randomUUID(),
          profile_id: subscription.profile_id,
          amount: bonusCoins,
          type: 'SUBSCRIPTION_BONUS',
          order_id: payload.resource.id,
        });
      if (coinTxnError) throw coinTxnError;
    }
  } catch (error) {
    console.error('Error processing subscription payment:', error);
  }
} 