import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's subscription ID from your database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.subscription_id) {
      throw new Error('No active subscription found');
    }

    // Cancel the subscription with PayPal
    const accessToken = await getPayPalAccessToken();
    const cancelResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscription.subscription_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Customer requested cancellation'
      }),
    });

    if (!cancelResponse.ok) {
      throw new Error('Failed to cancel subscription with PayPal');
    }

    // Update the subscription status in your database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 