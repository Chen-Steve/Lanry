import { useQuery } from '@tanstack/react-query'
import { ForumThread, ForumDiscussion } from '@/types/forum'

interface ThreadsResponse {
  threads: ForumThread[]
  discussion: ForumDiscussion
  total: number
  pages: number
}

async function getThreads(slug: string): Promise<ThreadsResponse> {
  const res = await fetch(`/api/forum/discussions/${encodeURIComponent(slug)}/threads`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch threads')
  const json = await res.json()
  return json as ThreadsResponse
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