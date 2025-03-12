'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabaseClient'
import { generateUUID } from '@/lib/utils'

export function useThreadMutations() {
  const queryClient = useQueryClient()

  const createThread = useMutation({
    mutationFn: async ({ title, discussionSlug }: { title: string, discussionSlug: string }) => {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Unauthorized')

      // First get the discussion
      const { data: discussion, error: discussionError } = await supabase
        .from('forum_discussions')
        .select('id')
        .eq('slug', discussionSlug)
        .single()

      if (discussionError) {
        console.error('Discussion fetch error:', discussionError)
        throw new Error('Discussion not found')
      }
      if (!discussion) throw new Error('Discussion not found')

      const now = new Date().toISOString()

      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .insert([{
          id: generateUUID(),
          title,
          discussion_id: discussion.id,
          author_id: session.user.id,
          created_at: now,
          updated_at: now,
          last_message_at: now
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

      if (threadError) throw threadError
      return thread
    },
    onSuccess: (_, { discussionSlug }) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads', discussionSlug] })
    }
  })

  const deleteThread = useMutation({
    mutationFn: async (threadId: string) => {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Unauthorized')

      // First get the thread to check ownership and get discussion info
      const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .select(`
          *,
          discussion:forum_discussions (
            slug
          )
        `)
        .eq('id', threadId)
        .single()

      if (threadError) throw new Error('Thread not found')
      if (!thread) throw new Error('Thread not found')
      if (thread.author_id !== session.user.id) throw new Error('Not authorized to delete this thread')

      // Delete the thread
      const { error: deleteError } = await supabase
        .from('forum_threads')
        .delete()
        .eq('id', threadId)

      if (deleteError) throw deleteError

      return {
        success: true,
        discussionSlug: thread.discussion.slug
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads', data.discussionSlug] })
    }
  })

  return {
    createThread,
    deleteThread
  }
} 