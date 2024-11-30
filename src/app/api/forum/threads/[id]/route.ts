import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forumService } from '@/services/forumService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the session from the request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
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

    // Check if user is the thread author or an admin
    const thread = await prisma.forumThread.findUnique({
      where: { id: params.id },
      select: { authorId: true }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    if (thread.authorId !== user.id) {
      // TODO: Add admin check here when admin roles are implemented
      return NextResponse.json(
        { error: 'Unauthorized to delete this thread' },
        { status: 403 }
      );
    }

    await forumService.deleteThread(params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
} 