import { NextResponse } from "next/server";
import supabaseAdmin from '@/lib/supabaseAdmin';
import { createServerClient } from '@/lib/supabaseServer';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId, subscriptionId, membershipTierId } = await req.json();

    // Create supabase SSR client for auth
    const supabase = await createServerClient();
    
    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate subscription dates (default to 1 month)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Check for an existing subscription BEFORE upsert so we can decide
    // whether the user already received coins for the current billing cycle.
    const { data: existingSub, error: existingSubError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, end_date')
      .eq('profile_id', userId)
      .maybeSingle();
    if (existingSubError && existingSubError.code !== 'PGRST116') {
      // Ignore no rows returned; otherwise throw
      throw existingSubError;
    }

    // Create or update subscription record
    const { data: subscription, error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        profile_id: userId,
        paypal_subscription_id: subscriptionId,
        status: 'ACTIVE',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        latest_billing_date: startDate.toISOString(),
        cancelled_at: null,
      }, { onConflict: 'profile_id' })
      .select('id, profile_id, paypal_subscription_id, status, start_date, end_date, latest_billing_date, cancelled_at')
      .single();
    if (upsertError || !subscription) {
      throw upsertError ?? new Error('Failed to upsert subscription');
    }

    // Record the subscription transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('subscription_transactions')
      .insert({
        subscription_id: subscription.id,
        profile_id: userId,
        paypal_subscription_id: subscriptionId,
        type: 'SUBSCRIPTION_START',
        amount: getMembershipAmount(membershipTierId),
      })
      .select('*')
      .single();
    if (transactionError || !transaction) {
      throw transactionError ?? new Error('Failed to record subscription transaction');
    }

    // Decide if we should award the initial 55-coin bonus.
    // Award when:
    //   • No previous subscription exists, OR
    //   • Previous subscription endDate is in the past (new billing cycle)
    let shouldAwardCoins = false;
    if (!existingSub) {
      shouldAwardCoins = true;
    } else if (existingSub.end_date && new Date(existingSub.end_date) < startDate) {
      shouldAwardCoins = true;
    }

    if (shouldAwardCoins) {
      const awardedCoins = 55;

      // Update the user's coin balance
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();
      if (profileError) throw profileError;

      const newCoins = (profile?.coins ?? 0) + awardedCoins;
      const { error: updateCoinsError } = await supabaseAdmin
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', userId);
      if (updateCoinsError) throw updateCoinsError;

      // Record the coin award transaction
      const { error: coinTxnError } = await supabaseAdmin
        .from('coin_transactions')
        .insert({
          id: randomUUID(),
          profile_id: userId,
          amount: awardedCoins,
          type: 'SUBSCRIPTION_BONUS',
          order_id: subscriptionId,
        });
      if (coinTxnError) throw coinTxnError;
    }

    return NextResponse.json({ 
      success: true, 
      subscription,
      transaction
    });
  } catch (error) {
    console.error("Error recording subscription:", error);
    return NextResponse.json(
      { error: "Failed to record subscription" },
      { status: 500 }
    );
  }
}

// Helper function to get the amount based on membership tier ID
function getMembershipAmount(tierIdAsNumber: number): number {
  switch (tierIdAsNumber) {
    case 1: // Supporter
      return 5;
    case 2: // Patron
      return 9;
    case 3: // Super Patron
      return 20;
    default:
      return 0;
  }
} 