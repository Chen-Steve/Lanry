import { useQuery } from '@tanstack/react-query'
import { ForumDiscussion } from '@/types/forum'

interface DiscussionsResponse {
  discussions: ForumDiscussion[]
  total: number
  pages: number
}

async function getDiscussions(): Promise<DiscussionsResponse> {
  const response = await fetch(`/api/forum/discussions`)
  if (!response.ok) {
    throw new Error('Failed to fetch discussions')
  }
  return response.json()
}

export function useDiscussions() {
  return useQuery({
    queryKey: ['forum', 'discussions'],
    queryFn: getDiscussions
  })
} 