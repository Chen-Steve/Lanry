import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    console.log('Webhook received - starting processing');
    const formData = await request.formData();
    console.log('Form data received:', formData);
    
    const dataString = formData.get('data');
    console.log('Raw data string:', dataString);
    
    const kofiData: KofiData = JSON.parse(dataString as string);
    console.log('Parsed Ko-fi data:', kofiData);

    // Verify the webhook is from Ko-fi
    if (kofiData.verification_token !== KOFI_VERIFICATION_TOKEN) {
      console.log('Invalid verification token:', kofiData.verification_token);
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
    }
    console.log('Verification token validated');

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
    console.log('Coins to award:', coinsToAward);

    // Get user ID from message or email
    console.log('Looking up user with email:', kofiData.email);
    
    // Get user data using the admin client
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error accessing auth API:', authError);
      return NextResponse.json({ error: 'Auth API error', details: authError }, { status: 500 });
    }

    const authUser = users.find(user => user.email === kofiData.email);
    
    if (!authUser) {
      console.error('No user found with email:', kofiData.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Now get the profile using the auth user's ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.error('Error finding user profile:', userError);
      return NextResponse.json({ error: 'User profile not found', details: userError }, { status: 404 });
    }
    if (!userData) {
      console.error('No user profile found for ID:', authUser.id);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    console.log('Found user:', userData);

    // Get the current coin balance
    const { data: currentBalance, error: balanceError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userData.id)
      .single();

    if (balanceError) {
      console.error('Error getting current balance:', balanceError);
      return NextResponse.json({ error: 'Failed to get current balance', details: balanceError }, { status: 500 });
    }
    console.log('Current coin balance:', currentBalance?.coins || 0);

    // Update the user's coin balance in Supabase
    console.log('Attempting to increment coins for user:', userData.id);
    const newBalance = (currentBalance?.coins || 0) + coinsToAward;
    console.log('New balance will be:', newBalance);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        coins: newBalance
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating coins:', updateError);
      return NextResponse.json({ error: 'Failed to update coins', details: updateError }, { status: 500 });
    }

    // Verify the new balance
    const { data: verifyBalance, error: verifyError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userData.id)
      .single();
      
    if (verifyError) {
      console.error('Error verifying new balance:', verifyError);
    } else {
      console.log('Verified new balance:', verifyBalance.coins);
    }

    // Log the transaction
    console.log('Logging transaction');
    const { error: logError } = await supabase
      .from('coin_transactions')
      .insert({
        id: crypto.randomUUID(),
        profile_id: userData.id,
        amount: coinsToAward,
        type: kofiData.type.toLowerCase(),
        order_id: kofiData.kofi_transaction_id
      });

    if (logError) {
      console.error('Error logging transaction:', logError);
      // Continue even if logging fails
    }

    console.log('Webhook processing completed successfully');
    return NextResponse.json({ success: true, coinsAwarded: coinsToAward });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return more detailed error information
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 