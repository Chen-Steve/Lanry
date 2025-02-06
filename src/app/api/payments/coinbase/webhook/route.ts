import { NextRequest } from 'next/server';
import { handleWebhook } from '@/services/coinbaseService';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-cc-webhook-signature');
  
  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  const updateUserCoins = async (userId: string, coinsToAdd: number) => {
    await prisma.profile.update({
      where: { id: userId },
      data: {
        coins: {
          increment: coinsToAdd
        }
      }
    });
  };

  return handleWebhook(rawBody, signature, updateUserCoins);
} 