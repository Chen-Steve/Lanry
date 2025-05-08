import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { prisma } from '@/lib/prisma';

const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get the appropriate credentials based on environment
const getPayPalCredentials = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET
    };
  }
  return {
    clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID,
    clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET
  };
};

async function getPayPalAccessToken() {
  const credentials = getPayPalCredentials();
  
  // Validate environment variables
  if (!credentials.clientId || !credentials.clientSecret) {
    console.error('Missing PayPal credentials:', {
      environment: process.env.NODE_ENV,
      hasClientId: !!credentials.clientId,
      hasClientSecret: !!credentials.clientSecret,
      apiUrl: PAYPAL_API_URL
    });
    throw new Error('PayPal credentials not configured correctly for ' + process.env.NODE_ENV + ' environment.');
  }

  try {
    const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
    console.log('Using PayPal API URL:', PAYPAL_API_URL);
    console.log('Environment:', process.env.NODE_ENV);
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('PayPal token error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        apiUrl: PAYPAL_API_URL,
        environment: process.env.NODE_ENV,
        clientIdLength: credentials.clientId?.length || 0,
        clientSecretLength: credentials.clientSecret?.length || 0
      });
      throw new Error(`Failed to get PayPal access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('PayPal token error:', error);
    throw error;
  }
}

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's subscription from the database
    const subscription = await prisma.subscription.findUnique({
      where: { profileId: user.id }
    });

    if (!subscription) {
      console.error('No subscription found for user:', user.id);
      throw new Error('No active subscription found');
    }

    if (subscription.status === 'CANCELLED') {
      return NextResponse.json({ message: 'Subscription is already cancelled' });
    }

    // Cancel the subscription with PayPal
    const accessToken = await getPayPalAccessToken();
    const cancelResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscription.paypalSubscriptionId}/cancel`, {
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
      const errorData = await cancelResponse.text();
      console.error('PayPal cancellation error:', {
        status: cancelResponse.status,
        statusText: cancelResponse.statusText,
        error: errorData,
        subscriptionId: subscription.paypalSubscriptionId
      });
      throw new Error(`Failed to cancel PayPal subscription: ${cancelResponse.status} ${cancelResponse.statusText}`);
    }

    // Update the subscription status in the database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // Record the cancellation transaction
    await prisma.subscriptionTransaction.create({
      data: {
        subscriptionId: subscription.id,
        profileId: user.id,
        paypalSubscriptionId: subscription.paypalSubscriptionId,
        type: 'CANCELLATION',
        amount: 0,
      }
    });

    return NextResponse.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 