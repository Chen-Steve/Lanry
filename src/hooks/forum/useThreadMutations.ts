'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabaseClient'
import { generateUUID } from '@/lib/utils'
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Unauthorized')

      const { data: discussion, error: discussionError } = await supabase
        .from('forum_discussions')
        .select('id')
        .eq('slug', discussionSlug)
        .single()

      if (discussionError) throw discussionError
      if (!discussion) throw new Error('Discussion not found')

      const threadId = generateUUID()
      const now = new Date().toISOString()

      const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .insert([{
          id: threadId,
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
          ),
          discussion:forum_discussions (
            slug
          )
        `)
        .single()

      if (threadError) throw threadError

      return thread
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Unauthorized')

      // Get thread info first for optimistic update
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

      if (threadError) throw threadError
      if (!thread) throw new Error('Thread not found')
      if (thread.author_id !== session.user.id) {
        throw new Error('Not authorized to delete this thread')
      }

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