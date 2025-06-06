import { NextResponse } from "next/server";
import supabaseAdmin from '@/lib/supabaseAdmin';
import { revalidatePath } from "next/cache";

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
    const authorShare = Math.floor(amount * 0.5); // Calculate 50% share for author

    // Verify both users exist
    const { data: users, error: userError } = await supabaseAdmin
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

    // Update sender's coins (deduct full amount)
    const { error: senderError } = await supabaseAdmin
      .from('profiles')
      .update({ coins: sender.coins - amount })
      .eq('id', fromUserId);

    if (senderError) throw senderError;

    // Update recipient's coins (author gets 50%)
    const { error: recipientError } = await supabaseAdmin
      .from('profiles')
      .update({ coins: recipient.coins + authorShare }) // Use calculated authorShare
      .eq('id', toUserId);

    if (recipientError) throw recipientError;

    const donationId = `donation_${Date.now()}_${fromUserId}_to_${toUserId}`;

    // Create transaction records
    const { error: transactionError } = await supabaseAdmin
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
          amount: authorShare, // Use calculated authorShare
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