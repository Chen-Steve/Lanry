import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Get the cookie store
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Get the session directly from supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // 3. Log for debugging
    console.log('Session in API:', session);
    console.log('Session error:', sessionError);

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 4. Get the request body
    const { orderId, coins } = await request.json();

    if (!orderId || !coins) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // 5. Update the user's coins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // 6. Update coins and record transaction
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        coins: (profile.coins || 0) + coins
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update coins' },
        { status: 500 }
      );
    }

    // 7. Record the transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        profile_id: session.user.id,
        amount: coins,
        type: 'PURCHASE',
        order_id: orderId
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 