import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const thread = await prisma.forumThread.findUnique({
      where: {
        id: params.id
      },
      include: {
        author: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: thread.id,
      category_id: thread.categoryId,
      title: thread.title,
      content: thread.content,
      author_id: thread.authorId,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
      is_pinned: thread.isPinned,
      is_locked: thread.isLocked,
      post_count: thread._count.posts,
      last_post_at: thread.updatedAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      }
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
} 