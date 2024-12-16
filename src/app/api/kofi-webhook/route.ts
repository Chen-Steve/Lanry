import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

interface KofiData {
  message_id: string;
  timestamp: string;
  type: string;
  is_public: boolean;
  from_name: string;
  message: string;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
  verification_token: string;
  shop_items: Array<{
    direct_link_code: string;
  }>;
}

const KOFI_VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const kofiData: KofiData = JSON.parse(data.data);

    // Verify the webhook is from Ko-fi
    if (kofiData.verification_token !== KOFI_VERIFICATION_TOKEN) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
    }

    // Extract the user ID from the message or shop item code
    // You'll need to implement your own logic to map Ko-fi purchases to user IDs
    // This is just an example assuming the shop item code contains the user ID
    const shopItem = kofiData.shop_items?.[0];
    if (!shopItem?.direct_link_code) {
      return NextResponse.json({ error: 'No shop item found' }, { status: 400 });
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

    // Update the user's coin balance in Supabase
    const { error: updateError } = await supabase.rpc(
      'increment_coins',
      { 
        user_id: shopItem.direct_link_code,
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
        user_id: shopItem.direct_link_code,
        amount: coinsToAward,
        transaction_type: 'purchase',
        payment_id: kofiData.kofi_transaction_id,
        payment_platform: 'kofi'
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