import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Find discussion first (by slug)
    const discussion = await prisma.forumDiscussion.findUnique({
      where: { slug: params.slug }
    })

    if (!discussion) {
      return new NextResponse('Discussion not found', { status: 404 })
    }

    // Fetch threads that belong to this discussion
    const threads = await prisma.forumThread.findMany({
      where: { discussionId: discussion.id },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        isPinned: true,
        isLocked: true,
        viewCount: true,
        lastMessageAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
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
      where: { discussionId: discussion.id }
    })

    // Increment view count for the discussion (non-critical if it fails)
    await prisma.$executeRaw`
      UPDATE forum_discussions 
      SET view_count = view_count + 1 
      WHERE id = ${discussion.id}
    `

    return NextResponse.json({
      discussion,
      threads,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[DISCUSSION_THREADS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 