import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const supabase = await createServerClient()

    const { data: discussionsRows, error, count } = await supabase
      .from('forum_discussions')
      .select('*', { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      throw error
    }

    type DiscussionRow = {
      id: string
      title: string
      slug: string
      description: string
      created_at: string
      updated_at: string
      is_pinned: boolean
      is_locked: boolean
      view_count: number | null
    }

    const discussionIds = (discussionsRows || []).map((d: DiscussionRow) => d.id)

    const threadCountsByDiscussionId: Record<string, number> = {}
    if (discussionIds.length > 0) {
      const { data: threadsForCounts } = await supabase
        .from('forum_threads')
        .select('id,discussion_id')
        .in('discussion_id', discussionIds)

      if (threadsForCounts) {
        for (const row of threadsForCounts as { id: string; discussion_id: string }[]) {
          threadCountsByDiscussionId[row.discussion_id] = (threadCountsByDiscussionId[row.discussion_id] || 0) + 1
        }
      }
    }

    const discussions = (discussionsRows || []).map((d: DiscussionRow) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      description: d.description,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      isPinned: d.is_pinned,
      isLocked: d.is_locked,
      viewCount: d.view_count ?? 0,
      threads: [],
      _count: { threads: threadCountsByDiscussionId[d.id] || 0 }
    }))

    const total = count || 0

    return NextResponse.json({ discussions, total, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[FORUM_DISCUSSIONS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const body = await req.json()
    const { title, description, slug } = body

    if (!title || !description || !slug) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const { data, error } = await supabase
      .from('forum_discussions')
      .insert([{ title, description, slug }])
      .select('*')
      .single()

    if (error) throw error

    const discussion = {
      id: data.id,
      title: data.title,
      description: data.description,
      slug: data.slug,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isPinned: data.is_pinned,
      isLocked: data.is_locked,
      viewCount: data.view_count ?? 0,
      threads: [],
      _count: { threads: 0 }
    }

    return NextResponse.json(discussion)
  } catch (error) {
    console.error('[FORUM_DISCUSSIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 