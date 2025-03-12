import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const discussion = await prisma.forumDiscussion.findUnique({
      where: { slug: params.slug }
    })

    if (!discussion) {
      return new NextResponse('Discussion not found', { status: 404 })
    }

    return NextResponse.json(discussion)
  } catch (error) {
    console.error('[FORUM_DISCUSSION_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 