'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabaseClient'
import { generateUUID } from '@/lib/utils'

export function useForumMutations() {
  const queryClient = useQueryClient()

  const createMessage = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string, content: string }) => {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Unauthorized')

      const now = new Date().toISOString()

      // Create the message
      const { data: message, error: messageError } = await supabase
        .from('forum_messages')
        .insert([{
          id: generateUUID(),
          thread_id: threadId,
          author_id: session.user.id,
          content,
          created_at: now,
          updated_at: now
        }])
        .select(`
          *,
          author:profiles (
            id,
            username,
            avatar_url
          )
        `)
        .single()

      if (messageError) throw messageError

      // Update thread's last_message_at
      const { error: threadError } = await supabase
        .from('forum_threads')
        .update({ last_message_at: now })
        .eq('id', threadId)

      if (threadError) throw threadError

      return message
    },
    onSuccess: (_, { threadId }) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'messages', threadId] })
    }
  })

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Unauthorized')

      const { error } = await supabase
        .from('forum_messages')
        .delete()
        .eq('id', messageId)
        .eq('author_id', session.user.id)

      if (error) throw error

      return { success: true }
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'messages'] })
    }
  })

  return {
    createMessage,
    deleteMessage
  }
} 