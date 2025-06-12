import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string; threadId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Ensure the thread exists and belongs to the specified discussion via slug
    const thread = await prisma.forumThread.findFirst({
      where: {
        id: params.threadId,
        discussion: {
          slug: params.slug
        }
      },
      select: {
        authorId: true,
        discussion: {
          select: {
            slug: true
          }
        }
      }
    })

    if (!thread) {
      return new NextResponse('Thread not found', { status: 404 })
    }

    // Check if user is the thread author
    if (thread.authorId !== session.user.id) {
      return new NextResponse('Not authorized to delete this thread', { status: 403 })
    }

    await prisma.forumThread.delete({
      where: { id: params.threadId }
    })

    return NextResponse.json({
      success: true,
      discussionSlug: thread.discussion.slug
    })
  } catch (error) {
    console.error('[DISCUSSION_THREAD_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 