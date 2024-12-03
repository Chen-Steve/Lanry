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

    // Check if user has already liked
    const existingVote = await prisma.forumVote.findUnique({
      where: {
        authorId_postId: {
          authorId: user.id,
          postId: params.id
        }
      }
    });

    if (existingVote) {
      // Remove like if it exists
      await prisma.$transaction([
        prisma.forumVote.delete({
          where: { id: existingVote.id }
        }),
        prisma.forumPost.update({
          where: { id: params.id },
          data: {
            score: { decrement: 1 }
          }
        })
      ]);

      const updatedPost = await prisma.forumPost.findUnique({
        where: { id: params.id },
        select: { score: true }
      });

      return NextResponse.json({ 
        score: updatedPost?.score || 0,
        liked: false
      });
    } else {
      // Create new like
      await prisma.$transaction([
        prisma.forumVote.create({
          data: {
            authorId: user.id,
            postId: params.id
          }
        }),
        prisma.forumPost.update({
          where: { id: params.id },
          data: {
            score: { increment: 1 }
          }
        })
      ]);

      const updatedPost = await prisma.forumPost.findUnique({
        where: { id: params.id },
        select: { score: true }
      });

      return NextResponse.json({ 
        score: updatedPost?.score || 0,
        liked: true
      });
    }
  } catch (error) {
    console.error('Error voting on post:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
} 