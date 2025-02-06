import { Client, Webhook } from 'coinbase-commerce-node';
import { NextResponse } from 'next/server';

const client = Client.init(process.env.COINBASE_COMMERCE_API_KEY!);

export const createCharge = async (userId: string, coins: number, amount: number) => {
  try {
    const charge = await client.charges.create({
      name: `${coins} Coins Purchase`,
      description: `Purchase of ${coins} coins`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency: 'USD'
      },
      metadata: {
        userId,
        coins
      }
    });
    
    return charge;
  } catch (error) {
    console.error('Error creating Coinbase charge:', error);
    throw new Error('Failed to create payment');
  }
};

export const handleWebhook = async (
  rawBody: string,
  signature: string,
  updateUserCoins: (userId: string, coins: number) => Promise<void>
) => {
  try {
    const event = Webhook.verifyEventBody(
      rawBody,
      signature,
      process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!
    );

    if (event.type === 'charge:confirmed') {
      const { userId, coins } = event.data.metadata;
      await updateUserCoins(userId, parseInt(coins));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }
}; 