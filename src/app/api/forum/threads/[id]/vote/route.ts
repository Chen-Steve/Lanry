import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { direction } = await request.json();
    const voteValue = direction === 'up' ? 1 : -1;

    // Use a transaction to handle the vote
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing vote
      const existingVote = await tx.forumVote.findUnique({
        where: {
          authorId_threadId: {
            authorId: user.id,
            threadId: params.id
          }
        }
      });

      let scoreChange = voteValue;

      if (existingVote) {
        if (existingVote.direction === voteValue) {
          // Remove vote if clicking the same direction
          await tx.forumVote.delete({
            where: { id: existingVote.id }
          });
          scoreChange = -voteValue;
        } else {
          // Change vote direction
          await tx.forumVote.update({
            where: { id: existingVote.id },
            data: { direction: voteValue }
          });
          scoreChange = voteValue * 2; // Double the change because we're flipping the vote
        }
      } else {
        // Create new vote
        await tx.forumVote.create({
          data: {
            direction: voteValue,
            authorId: user.id,
            threadId: params.id
          }
        });
      }

      // Update thread score
      const thread = await tx.forumThread.update({
        where: { id: params.id },
        data: {
          score: { increment: scoreChange }
        }
      });

      return {
        score: thread.score,
        userVote: scoreChange === -voteValue ? 0 : voteValue
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error voting on thread:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
} 