'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ForumThread } from '@/types/forum'

interface CreateThreadVariables {
  title: string
  discussionSlug: string
}

interface ThreadsQueryData {
  threads: ForumThread[]
  discussion: {
    id: string
    title: string
    slug: string
  }
  total: number
  pages: number
}

export function useThreadMutations() {
  const queryClient = useQueryClient()

  const createThread = useMutation({
    mutationFn: async ({ title, discussionSlug }: CreateThreadVariables) => {
      const res = await fetch(`/api/forum/discussions/${encodeURIComponent(discussionSlug)}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (res.status === 401) throw new Error('Unauthorized')
      if (!res.ok) throw new Error('Failed to create thread')
      const json: ForumThread = await res.json()
      return json
    },
    onSuccess: (thread, { discussionSlug }) => {
      // Get current data from cache
      const currentData = queryClient.getQueryData<ThreadsQueryData>(['forum', 'threads', discussionSlug])
      
      if (currentData) {
        // Update cache with new thread
        queryClient.setQueryData(['forum', 'threads', discussionSlug], {
          ...currentData,
          threads: [thread, ...currentData.threads],
          total: currentData.total + 1,
          pages: Math.ceil((currentData.total + 1) / 20)
        })
      } else {
        // If no cache exists, invalidate to trigger refetch
        queryClient.invalidateQueries({ 
          queryKey: ['forum', 'threads', discussionSlug],
          exact: true
        })
      }
    }
  })

  const deleteThread = useMutation({
    mutationFn: async (threadId: string) => {
      // We need the discussion slug for cache keys; fetch via API GET thread
      const getRes = await fetch(`/api/forum/threads/${encodeURIComponent(threadId)}`)
      if (!getRes.ok) throw new Error('Failed to resolve thread')
      const thread = await getRes.json() as ForumThread

      const res = await fetch(`/api/forum/discussions/${encodeURIComponent(thread.discussion.slug)}/threads/${encodeURIComponent(threadId)}`, {
        method: 'DELETE'
      })
      if (res.status === 401) throw new Error('Unauthorized')
      if (res.status === 403) throw new Error('Not authorized to delete this thread')
      if (!res.ok) throw new Error('Failed to delete thread')

      return { success: true, discussionSlug: thread.discussion.slug }
    },
    onMutate: async (threadId: string) => {
      // Get the current thread from cache
      const thread = queryClient.getQueryData<ForumThread>(['forum', 'thread', threadId])
      if (!thread?.discussion?.slug) return { threadId }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['forum', 'threads', thread.discussion.slug],
        exact: true
      })

      // Get current data
      const previousData = queryClient.getQueryData<ThreadsQueryData>(['forum', 'threads', thread.discussion.slug])
      
      if (previousData) {
        // Optimistically remove thread
        queryClient.setQueryData(['forum', 'threads', thread.discussion.slug], {
          ...previousData,
          threads: previousData.threads.filter(t => t.id !== threadId),
          total: previousData.total - 1,
          pages: Math.ceil((previousData.total - 1) / 20)
        })
      }

      return { previousData, threadId, discussionSlug: thread.discussion.slug }
    },
    onError: (err, threadId, context) => {
      if (context?.previousData && context.discussionSlug) {
        // Restore previous data on error
        queryClient.setQueryData(
          ['forum', 'threads', context.discussionSlug],
          context.previousData
        )
      }
    },
    onSuccess: (data) => {
      // Ensure cache is up to date
      queryClient.invalidateQueries({ 
        queryKey: ['forum', 'threads', data.discussionSlug],
        exact: true
      })
    }
  })

  return {
    createThread,
    deleteThread
  }
} 