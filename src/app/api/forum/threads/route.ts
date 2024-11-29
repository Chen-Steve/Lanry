import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const { title, content, categoryId } = await request.json();

    // Validate input
    if (!title || !content || !categoryId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const thread = await prisma.forumThread.create({
      data: {
        title,
        content,
        categoryId,
        authorId: session.user.id,
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
        id: thread.id,
        category_id: thread.categoryId,
        title: thread.title,
        content: thread.content,
        author_id: thread.authorId,
        created_at: thread.createdAt.toISOString(),
        updated_at: thread.updatedAt.toISOString(),
        is_pinned: thread.isPinned,
        is_locked: thread.isLocked,
        post_count: 0,
        last_post_at: thread.createdAt.toISOString(),
        author: {
          username: thread.author.username || 'Unknown User'
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
    console.error('Error creating thread:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create thread' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 