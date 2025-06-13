import { useQuery } from '@tanstack/react-query'
import { ForumThread, ForumDiscussion } from '@/types/forum'
import supabase from '@/lib/supabaseClient'

interface ThreadsResponse {
  threads: ForumThread[]
  discussion: ForumDiscussion
  total: number
  pages: number
}

async function getThreads(slug: string): Promise<ThreadsResponse> {
  // Get discussion first
  const { data: discussion, error: discussionError } = await supabase
    .from('forum_discussions')
    .select('*')
    .eq('slug', slug)
    .single()

  if (discussionError) throw discussionError
  if (!discussion) throw new Error('Discussion not found')

  // Get threads for this discussion
  const { data: threads, error: threadsError } = await supabase
    .from('forum_threads')
    .select(`
      *,
      author:profiles (
        id,
        username,
        avatar_url
      ),
      _count: forum_messages (
        count
      )
    `)
    .eq('discussion_id', discussion.id)
    .order('is_pinned', { ascending: false })
    .order('last_message_at', { ascending: false })

  if (threadsError) throw threadsError

  // Get total count
  const { count, error: countError } = await supabase
    .from('forum_threads')
    .select('*', { count: 'exact', head: true })
    .eq('discussion_id', discussion.id)

  if (countError) throw countError

  // Increment view count (non-critical)
  try {
    await supabase.rpc('increment_discussion_views', { discussion_id: discussion.id })
  } catch (error) {
    console.error('[INCREMENT_VIEWS_ERROR]', error)
  }

  return {
    discussion,
    threads: threads.map(thread => ({
      ...thread,
      _count: {
        messages: thread._count?.[0]?.count || 0
      }
    })),
    total: count || 0,
    pages: Math.ceil((count || 0) / 20)
  }
}

export function useThreads(slug: string) {
  return useQuery({
    queryKey: ['forum', 'threads', slug],
    queryFn: () => getThreads(slug),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })
} 