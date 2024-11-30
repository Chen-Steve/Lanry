import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session from the request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { threadId, content } = await request.json();

    // Validate input
    if (!threadId || !content) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Check if thread exists and is not locked
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { isLocked: true }
    });

    if (!thread) {
      return new NextResponse(
        JSON.stringify({ error: 'Thread not found' }),
        { status: 404 }
      );
    }

    if (thread.isLocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Thread is locked' }),
        { status: 403 }
      );
    }

    const post = await prisma.forumPost.create({
      data: {
        content,
        threadId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return new NextResponse(
      JSON.stringify({
        id: post.id,
        thread_id: post.threadId,
        content: post.content,
        author_id: post.authorId,
        created_at: post.createdAt.toISOString(),
        updated_at: post.updatedAt.toISOString(),
        author: {
          username: post.author.username || 'Unknown User'
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create post' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 