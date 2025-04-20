import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const discussions = await prisma.forumDiscussion.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: {
        threads: {
          take: 1,
          orderBy: {
            lastMessageAt: 'desc'
          },
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
            }
          }
        },
        _count: {
          select: {
            threads: true
          }
        }
      },
      skip,
      take: limit
    })

    const total = await prisma.forumDiscussion.count()

    return NextResponse.json({
      discussions,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[FORUM_DISCUSSIONS_GET]', error)
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
    const { title, description, slug } = body

    if (!title || !description || !slug) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const discussion = await prisma.forumDiscussion.create({
      data: {
        title,
        description,
        slug
      }
    })

    return NextResponse.json(discussion)
  } catch (error) {
    console.error('[FORUM_DISCUSSIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 