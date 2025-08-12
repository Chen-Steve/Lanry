import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

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
    const supabase = await createServerClient()
    const { data: discussion, error: discussionError } = await supabase
      .from('forum_discussions')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (discussionError) throw discussionError

    if (!discussion) {
      return new NextResponse('Discussion not found', { status: 404 })
    }

    // Fetch threads that belong to this discussion
    const { data: threadRows, error: threadsError } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:profiles (id, username, avatar_url)
      `)
      .eq('discussion_id', discussion.id)
      .order('is_pinned', { ascending: false })
      .order('last_message_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (threadsError) throw threadsError

    const { count: total, error: countError } = await supabase
      .from('forum_threads')
      .select('*', { count: 'exact', head: true })
      .eq('discussion_id', discussion.id)

    if (countError) throw countError

    // Increment view count for the discussion (non-critical if it fails)
    try {
      await supabase
        .from('forum_discussions')
        .update({ view_count: (discussion.view_count ?? 0) + 1 })
        .eq('id', discussion.id)
    } catch {}

    type ThreadRow = {
      id: string
      title: string
      is_pinned: boolean
      is_locked: boolean
      view_count: number | null
      last_message_at: string | null
      author?: { id: string; username: string; avatar_url: string | null } | null
    }

    const totalExact = total ?? 0

    return NextResponse.json({
      discussion: {
        id: discussion.id,
        title: discussion.title,
        slug: discussion.slug,
        description: discussion.description,
        createdAt: discussion.created_at,
        updatedAt: discussion.updated_at,
        isPinned: discussion.is_pinned,
        isLocked: discussion.is_locked,
        viewCount: discussion.view_count ?? 0
      },
      threads: (threadRows || []).map((t: ThreadRow) => ({
        id: t.id,
        title: t.title,
        isPinned: t.is_pinned,
        isLocked: t.is_locked,
        viewCount: t.view_count ?? 0,
        lastMessageAt: t.last_message_at,
        author: {
          id: t.author?.id,
          username: t.author?.username,
          avatarUrl: t.author?.avatar_url ?? null
        },
        _count: undefined
      })),
      total: totalExact,
      pages: Math.ceil(totalExact / limit)
    })
  } catch (error) {
    console.error('[DISCUSSION_THREADS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 