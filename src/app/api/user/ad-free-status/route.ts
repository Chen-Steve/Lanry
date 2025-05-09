import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Minimum amount of coins purchased to qualify for ad-free experience
const AD_FREE_THRESHOLD = 50;

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ isAdFree: false }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if user already has ad-free status in profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('isAdFree')
      .eq('id', userId)
      .single();
    
    if (profile?.isAdFree) {
      return NextResponse.json({ isAdFree: true });
    }
    
    // Otherwise check total coin purchases
    const { data: transactions, error: transactionError } = await supabase
      .from('coin_transactions')
      .select('amount')
      .eq('profile_id', userId)
      .eq('type', 'PURCHASE');
    
    if (transactionError) {
      throw transactionError;
    }
    
    // Calculate total coins purchased
    const totalCoinsPurchased = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    
    // Determine ad-free status based on threshold
    const isAdFree = totalCoinsPurchased >= AD_FREE_THRESHOLD;
    
    // Update the profile if user qualifies for ad-free
    if (isAdFree) {
      await supabase
        .from('profiles')
        .update({ isAdFree: true })
        .eq('id', userId);
    }
    
    return NextResponse.json({ isAdFree });
  } catch (error) {
    console.error('Error checking ad-free status:', error);
    return NextResponse.json({ error: 'Failed to check ad-free status' }, { status: 500 });
  }
} 