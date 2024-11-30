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

    // Check if user has already voted
    const existingVotes = await prisma.forumVote.count({
      where: {
        authorId: user.id,
        postId: params.id
      }
    });

    if (existingVotes > 0) {
      return NextResponse.json(
        { error: 'You have already voted on this post' },
        { status: 400 }
      );
    }

    // Create the vote and update the score
    await prisma.$transaction([
      prisma.forumVote.create({
        data: {
          authorId: user.id,
          postId: params.id,
          direction: voteValue
        }
      }),
      prisma.forumPost.update({
        where: { id: params.id },
        data: {
          score: { increment: voteValue }
        }
      })
    ]);

    const updatedPost = await prisma.forumPost.findUnique({
      where: { id: params.id },
      select: { score: true }
    });

    return NextResponse.json({ score: updatedPost?.score || 0 });
  } catch (error) {
    console.error('Error voting on post:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
} 