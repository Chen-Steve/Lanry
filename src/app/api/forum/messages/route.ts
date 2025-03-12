import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get('threadId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!threadId) {
      return new NextResponse('Thread ID is required', { status: 400 })
    }

    const messages = await prisma.forumMessage.findMany({
      where: {
        threadId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            role: true
          }
        }
      },
      skip,
      take: limit
    })

    const total = await prisma.forumMessage.count({
      where: {
        threadId
      }
    })

    return NextResponse.json({
      messages,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[FORUM_MESSAGES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { content, threadId } = body

    if (!content || !threadId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        discussion: true
      }
    })

    if (!thread) {
      return new NextResponse('Thread not found', { status: 404 })
    }

    if (thread.isLocked || thread.discussion.isLocked) {
      return new NextResponse('Thread is locked', { status: 403 })
    }

    const message = await prisma.forumMessage.create({
      data: {
        content,
        threadId,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    })

    // Update thread's lastMessageAt
    await prisma.forumThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: new Date()
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('[FORUM_MESSAGES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 