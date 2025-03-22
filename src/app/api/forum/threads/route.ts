import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const discussionId = searchParams.get('discussionId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!discussionId) {
      return new NextResponse('Discussion ID is required', { status: 400 })
    }

    const threads = await prisma.forumThread.findMany({
      where: {
        discussionId
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' }
      ],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      skip,
      take: limit
    })

    const total = await prisma.forumThread.count({
      where: {
        discussionId
      }
    })

    // Update discussion view count
    await prisma.$executeRaw`
      UPDATE forum_discussions 
      SET view_count = view_count + 1 
      WHERE id = ${discussionId}
    `
    return NextResponse.json({
      threads,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[FORUM_THREADS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, discussionSlug } = await request.json()

    const discussion = await prisma.forumDiscussion.findUnique({
      where: { slug: discussionSlug }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (discussion.isLocked) {
      return NextResponse.json({ error: 'Discussion is locked' }, { status: 403 })
    }

    const thread = await prisma.forumThread.create({
      data: {
        title,
        discussionId: discussion.id,
        authorId: session.user.id,
        lastMessageAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json(thread)
  } catch (error) {
    console.error('[CREATE_THREAD]', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
} 