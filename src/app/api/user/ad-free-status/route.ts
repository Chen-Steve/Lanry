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
    
    // Check total coin purchases to determine ad-free status
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
    
    // Cache the response for 1 hour
    const response = NextResponse.json({ isAdFree });
    response.headers.set('Cache-Control', 'private, max-age=3600');
    
    return response;
  } catch (error) {
    console.error('Error checking ad-free status:', error);
    return NextResponse.json({ error: 'Failed to check ad-free status' }, { status: 500 });
  }
} 