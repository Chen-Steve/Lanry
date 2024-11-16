import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { orderId, coins } = await request.json();
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start a transaction
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Update user's coin balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        coins: (profile.coins || 0) + coins,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      throw updateError;
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        profile_id: session.user.id,
        amount: coins,
        type: 'PURCHASE',
        order_id: orderId
      });

    if (transactionError) {
      throw transactionError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 