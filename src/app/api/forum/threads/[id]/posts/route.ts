import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const posts = await prisma.forumPost.findMany({
      where: {
        threadId: params.id
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json(posts.map(post => ({
      id: post.id,
      thread_id: post.threadId,
      content: post.content,
      author_id: post.authorId,
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
      author: {
        username: post.author.username || 'Unknown User'
      }
    })));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 