import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

interface KofiData {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: 'Donation' | 'Subscription' | 'Commission' | 'Shop Order';
  is_public: boolean;
  from_name: string;
  message: string | null;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  shop_items: Array<{ direct_link_code: string }> | null;
  tier_name: string | null;
}

const KOFI_VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const kofiData: KofiData = JSON.parse(formData.get('data') as string);

    // Verify the webhook is from Ko-fi
    if (kofiData.verification_token !== KOFI_VERIFICATION_TOKEN) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
    }

    // Parse the amount to determine coins to award
    const amount = parseFloat(kofiData.amount);
    let coinsToAward = 0;

    // Map dollar amounts to coins based on your packages
    switch (amount) {
      case 1: coinsToAward = 10; break;
      case 5: coinsToAward = 50; break;
      case 10: coinsToAward = 100; break;
      case 20: coinsToAward = 200; break;
      default: coinsToAward = Math.floor(amount * 10); // Fallback calculation
    }

    // Get user ID from message or email (you'll need to implement your own mapping logic)
    // For now, we'll use the email to find the user
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', kofiData.email)
      .single();

    if (userError || !userData) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's coin balance in Supabase
    const { error: updateError } = await supabase.rpc(
      'increment_coins',
      { 
        user_id: userData.id,
        coins_to_add: coinsToAward 
      }
    );

    if (updateError) {
      console.error('Error updating coins:', updateError);
      return NextResponse.json({ error: 'Failed to update coins' }, { status: 500 });
    }

    // Log the transaction
    const { error: logError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userData.id,
        amount: coinsToAward,
        transaction_type: kofiData.type.toLowerCase(),
        payment_id: kofiData.kofi_transaction_id,
        payment_platform: 'kofi',
        is_subscription: kofiData.is_subscription_payment,
        subscription_tier: kofiData.tier_name
      });

    if (logError) {
      console.error('Error logging transaction:', logError);
    }

    return NextResponse.json({ success: true, coinsAwarded: coinsToAward });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 