import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: thread, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:profiles (id, username, avatar_url),
        discussion:forum_discussions (id, title, slug),
        _count:forum_messages ( count )
      `)
      .eq('id', params.threadId)
      .single()

    if (error) throw error
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
    console.error('[FORUM_THREAD_GET_BY_ID]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}


