import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

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

    // Call your subscription service to cancel the subscription
    // This is a placeholder - you'll need to implement the actual cancellation logic
    // based on your payment provider (e.g., Stripe, PayPal, etc.)
    const response = await fetch(`${process.env.PAYMENT_API_URL}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}`
      },
      body: JSON.stringify({
        userId: user.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
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