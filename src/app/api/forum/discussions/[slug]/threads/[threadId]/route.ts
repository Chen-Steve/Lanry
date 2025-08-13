import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string; threadId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Ensure the thread exists and belongs to the specified discussion via slug
    const { data: discussion, error: discussionError } = await supabase
      .from('forum_discussions')
      .select('id, slug')
      .eq('slug', params.slug)
      .single()

    if (discussionError) throw discussionError

    if (!discussion) {
      return new NextResponse('Discussion not found', { status: 404 })
    }

    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('id, author_id')
      .eq('id', params.threadId)
      .eq('discussion_id', discussion.id)
      .single()

    if (threadError) throw threadError

    if (!thread) {
      return new NextResponse('Thread not found', { status: 404 })
    }

    // Check if user is the thread author
    if (thread.author_id !== user.id) {
      return new NextResponse('Not authorized to delete this thread', { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('forum_threads')
      .delete()
      .eq('id', params.threadId)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      discussionSlug: discussion.slug
    })
  } catch (error) {
    console.error('[DISCUSSION_THREAD_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 

export async function GET(
  request: Request,
  { params }: { params: { slug: string; threadId: string } }
) {
  try {
    const supabase = await createServerClient()
    // Ensure the thread belongs to the discussion via slug
    const { data: discussion, error: discussionError } = await supabase
      .from('forum_discussions')
      .select('id, slug')
      .eq('slug', params.slug)
      .single()

    if (discussionError) throw discussionError
    if (!discussion) {
      return new NextResponse('Discussion not found', { status: 404 })
    }

    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:profiles (id, username, avatar_url),
        discussion:forum_discussions (id, title, slug),
        _count:forum_messages ( count )
      `)
      .eq('id', params.threadId)
      .eq('discussion_id', discussion.id)
      .single()

    if (threadError) throw threadError
    if (!thread) {
      return new NextResponse('Thread not found', { status: 404 })
    }

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
    console.error('[DISCUSSION_THREAD_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}