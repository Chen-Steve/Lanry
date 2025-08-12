import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string; threadId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
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
    if (thread.author_id !== session.user.id) {
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