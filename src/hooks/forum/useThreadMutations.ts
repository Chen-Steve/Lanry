'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '@/lib/supabaseClient'
import { generateUUID } from '@/lib/utils'
import { ForumThread } from '@/types/forum'

interface CreateThreadVariables {
  title: string
  discussionSlug: string
}

interface DeleteThreadResponse {
  success: boolean
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

interface CreateThreadResponse {
  id: string
  title: string
  discussion_id: string
  author_id: string
  created_at: string
  updated_at: string
  last_message_at: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  author: {
    id: string
    username: string
    avatar_url: string | null
  }
  discussion: {
    slug: string
  }
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

      if (discussionError) {
        console.error('[DISCUSSION_FETCH_ERROR]', discussionError)
        throw new Error(discussionError.message ?? 'Discussion not found')
      }
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

      if (threadError) {
        console.error('[CREATE_THREAD_ERROR]', threadError)
        throw new Error(threadError.message ?? 'Failed to create thread')
      }

      return thread as CreateThreadResponse
    },
    onSuccess: (thread, { discussionSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads', discussionSlug] })
    }
  })

  const deleteThread = useMutation({
    mutationFn: async (threadId: string): Promise<DeleteThreadResponse> => {
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

      if (threadError) {
        console.error('[THREAD_FETCH_ERROR]', threadError)
        throw new Error(threadError.message ?? 'Thread not found')
      }
      if (!thread) throw new Error('Thread not found')
      if (thread.author_id !== session.user.id) {
        throw new Error('Not authorized to delete this thread')
      }

      const { error: deleteError } = await supabase
        .from('forum_threads')
        .delete()
        .eq('id', threadId)

      if (deleteError) {
        console.error('[DELETE_THREAD_ERROR]', deleteError)
        throw new Error(deleteError.message ?? 'Failed to delete thread')
      }

      return {
        success: true,
        discussionSlug: thread.discussion.slug
      }
    },
    onMutate: async (threadId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['forum', 'threads'] })

      // Get the current thread from cache
      const thread = queryClient.getQueryData<ForumThread>(['forum', 'thread', threadId])
      if (!thread?.discussion?.slug) return { threadId }

      // Optimistically remove the thread from the list
      const previousThreads = queryClient.getQueryData<ThreadsQueryData>(['forum', 'threads', thread.discussion.slug])
      if (previousThreads) {
        queryClient.setQueryData(['forum', 'threads', thread.discussion.slug], (old: ThreadsQueryData) => ({
          ...old,
          threads: old.threads.filter((t: ForumThread) => t.id !== threadId)
        }))
      }

      return { previousThreads, threadId, discussionSlug: thread.discussion.slug }
    },
    onError: (err, threadId, context) => {
      // Rollback on error
      if (context?.previousThreads && context.discussionSlug) {
        queryClient.setQueryData(
          ['forum', 'threads', context.discussionSlug],
          context.previousThreads
        )
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'threads', data.discussionSlug] })
    }
  })

  return {
    createThread,
    deleteThread
  }
} 