'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
// Moved to API-backed mutations for security and consistency

export function useForumMutations() {
  const queryClient = useQueryClient()

  const createMessage = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string, content: string }) => {
      const res = await fetch('/api/forum/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content })
      })
      if (res.status === 401) throw new Error('Unauthorized')
      if (res.status === 403) throw new Error('Thread is locked')
      if (!res.ok) throw new Error('Failed to create message')
      return res.json()
    },
    onSuccess: (_, { threadId }) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'messages', threadId] })
    }
  })

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/forum/messages?messageId=${encodeURIComponent(messageId)}`, {
        method: 'DELETE'
      })
      if (res.status === 401) throw new Error('Unauthorized')
      if (res.status === 403) throw new Error('Not authorized to delete this message')
      if (!res.ok) throw new Error('Failed to delete message')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'messages'] })
    }
  })

  const updateMessage = useMutation({
    mutationFn: async ({ id, content }: { id: string, content: string }) => {
      const res = await fetch('/api/forum/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content })
      })
      if (res.status === 401) throw new Error('Unauthorized')
      if (res.status === 403) throw new Error('Not authorized to edit this message')
      if (!res.ok) throw new Error('Failed to update message')
      return res.json()
    },
    onSuccess: (message) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'messages', message.thread_id] })
    }
  })

  return {
    createMessage,
    deleteMessage,
    updateMessage
  }
} 