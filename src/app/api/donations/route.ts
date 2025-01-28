import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to generate UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(req: Request) {
  try {
    const { fromUserId, toUserId, amount } = await req.json();

    // Verify both users exist
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, coins')
      .in('id', [fromUserId, toUserId]);

    if (userError || !users || users.length !== 2) {
      return NextResponse.json({ error: "Invalid users" }, { status: 400 });
    }

    const sender = users.find(u => u.id === fromUserId);
    const recipient = users.find(u => u.id === toUserId);

    if (!sender || !recipient) {
      return NextResponse.json({ error: "Invalid users" }, { status: 400 });
    }

    // Check if sender has enough coins
    if (sender.coins < amount) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }

    // Update sender's coins
    const { error: senderError } = await supabase
      .from('profiles')
      .update({ coins: sender.coins - amount })
      .eq('id', fromUserId);

    if (senderError) throw senderError;

    // Update recipient's coins
    const { error: recipientError } = await supabase
      .from('profiles')
      .update({ coins: recipient.coins + amount })
      .eq('id', toUserId);

    if (recipientError) throw recipientError;

    const donationId = `donation_${Date.now()}_${fromUserId}_to_${toUserId}`;

    // Create transaction records
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert([
        {
          id: uuidv4(),
          profile_id: fromUserId,
          amount: -amount,
          type: 'DONATION_SENT',
          order_id: donationId
        },
        {
          id: uuidv4(),
          profile_id: toUserId,
          amount: amount,
          type: 'DONATION_RECEIVED',
          order_id: donationId
        }
      ]);

    if (transactionError) throw transactionError;

    revalidatePath('/novels/[id]');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing donation:", error);
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    );
  }
} 