import { useQuery } from '@tanstack/react-query'
import { ForumThread, ForumDiscussion } from '@/types/forum'

interface ThreadsResponse {
  threads: ForumThread[]
  discussion: ForumDiscussion
  total: number
  pages: number
}

async function getThreads(slug: string): Promise<ThreadsResponse> {
  // First get the discussion by slug
  const discussionRes = await fetch(`/api/forum/discussions/${slug}`)
  if (!discussionRes.ok) {
    throw new Error('Failed to fetch discussion')
  }
  const discussion = await discussionRes.json()

  // Then get threads using the discussion ID
  const threadsRes = await fetch(`/api/forum/threads?discussionId=${discussion.id}`)
  if (!threadsRes.ok) {
    throw new Error('Failed to fetch threads')
  }
  const { threads, total, pages } = await threadsRes.json()

  return {
    threads,
    discussion,
    total,
    pages
  }
}

export function useThreads(slug: string) {
  return useQuery({
    queryKey: ['forum', 'threads', slug],
    queryFn: () => getThreads(slug)
  })
} 