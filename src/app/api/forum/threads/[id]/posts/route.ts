import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session from the request header
    const authHeader = request.headers.get('Authorization');
    let userId: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

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
        },
        votes: userId ? {
          where: {
            authorId: userId
          }
        } : false
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
      },
      score: post.score,
      isLiked: userId ? post.votes.length > 0 : false
    })));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 