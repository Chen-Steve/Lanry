import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { coins, userId } = await request.json();
    
    // Verify the userId from Supabase token
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const verifiedUserId = session?.user?.id;

    // Check that the verified ID matches the provided ID
    if (!verifiedUserId || verifiedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get current coins
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', verifiedUserId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch current coins:', fetchError);
      return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
    }

    // Update with new total
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        coins: (profile?.coins || 0) + coins,
        updated_at: new Date().toISOString()
      })
      .eq('id', verifiedUserId);

    if (updateError) {
      console.error('Failed to add coins:', updateError);
      return NextResponse.json({ error: 'Failed to add coins' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
} 