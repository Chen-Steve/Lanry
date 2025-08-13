import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

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
        author:profiles (id, username, avatar_url),
        discussion:forum_discussions (id, title, slug),
        _count:forum_messages ( count )
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
      created_at: string
      updated_at: string
      discussion_id: string
      author_id: string
      is_pinned: boolean
      is_locked: boolean
      view_count: number | null
      last_message_at: string | null
      author?: { id: string; username: string; avatar_url: string | null } | null
      discussion?: { id: string; title: string; slug: string } | null
      _count?: Array<{ count: number }>
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
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        discussionId: t.discussion_id,
        authorId: t.author_id,
        isPinned: t.is_pinned,
        isLocked: t.is_locked,
        viewCount: t.view_count ?? 0,
        lastMessageAt: t.last_message_at || t.updated_at || t.created_at,
        author: {
          id: t.author?.id,
          username: t.author?.username,
          avatarUrl: t.author?.avatar_url ?? null
        },
        discussion: t.discussion ? {
          id: t.discussion.id,
          title: t.discussion.title,
          slug: t.discussion.slug
        } : undefined,
        _count: { messages: t._count?.[0]?.count || 0 }
      })),
      total: totalExact,
      pages: Math.ceil(totalExact / limit)
    })
  } catch (error) {
    console.error('[DISCUSSION_THREADS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { title } = body as { title?: string }
    if (!title || title.trim().length === 0) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Find discussion by slug
    const { data: discussion, error: discussionError } = await supabase
      .from('forum_discussions')
      .select('id, title, slug, is_locked')
      .eq('slug', params.slug)
      .single()

    if (discussionError) throw discussionError
    if (!discussion) {
      return new NextResponse('Discussion not found', { status: 404 })
    }
    if (discussion.is_locked) {
      return new NextResponse('Discussion is locked', { status: 403 })
    }

    const now = new Date().toISOString()
    const newId = randomUUID()
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .insert([{
        id: newId,
        title: title.trim(),
        discussion_id: discussion.id,
        author_id: user.id,
        created_at: now,
        updated_at: now,
        last_message_at: now
      }])
      .select(`
        *,
        author:profiles (id, username, avatar_url),
        discussion:forum_discussions (id, title, slug),
        _count:forum_messages ( count )
      `)
      .single()

    if (threadError) throw threadError

    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      discussionId: thread.discussion_id,
      authorId: thread.author_id,
      isPinned: thread.is_pinned,
      isLocked: thread.is_locked,
      viewCount: thread.view_count ?? 0,
      lastMessageAt: thread.last_message_at || thread.updated_at || thread.created_at,
      author: {
        id: thread.author?.id,
        username: thread.author?.username,
        avatarUrl: thread.author?.avatar_url ?? null
      },
      discussion: thread.discussion ? {
        id: thread.discussion.id,
        title: thread.discussion.title,
        slug: thread.discussion.slug
      } : undefined,
      _count: { messages: thread._count?.[0]?.count || 0 }
    })
  } catch (error) {
    console.error('[DISCUSSION_THREADS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}