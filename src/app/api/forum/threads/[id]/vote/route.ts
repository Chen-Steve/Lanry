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

      if (existingVote) {
        // Remove like if it exists
        await tx.forumVote.delete({
          where: { id: existingVote.id }
        });
        
        // Update thread score
        const thread = await tx.forumThread.update({
          where: { id: params.id },
          data: {
            score: { decrement: 1 }
          }
        });

        return {
          score: thread.score,
          liked: false
        };
      } else {
        // Create new like
        await tx.forumVote.create({
          data: {
            authorId: user.id,
            threadId: params.id
          }
        });

        // Update thread score
        const thread = await tx.forumThread.update({
          where: { id: params.id },
          data: {
            score: { increment: 1 }
          }
        });

        return {
          score: thread.score,
          liked: true
        };
      }
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