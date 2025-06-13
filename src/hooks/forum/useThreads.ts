import { useQuery } from '@tanstack/react-query'
import { ForumThread, ForumDiscussion } from '@/types/forum'

interface ThreadsResponse {
  threads: ForumThread[]
  discussion: ForumDiscussion
  total: number
  pages: number
}

async function getThreads(slug: string): Promise<ThreadsResponse> {
  // Get discussion and its threads in one request
  const res = await fetch(`/api/forum/discussions/${slug}/threads`)
  if (!res.ok) {
    throw new Error('Failed to fetch threads')
  }
  const { discussion, threads, total, pages } = await res.json()

  return {
    discussion,
    threads,
    total,
    pages
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