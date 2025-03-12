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

  return {
    createThread
  }
} 