'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { useSupabase } from '@/app/providers'

export function useForum() {
  const { user, isLoading } = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(user?.id ?? null)
  }, [user])

  const createThread = async (title: string, discussionSlug: string) => {
    try {
      // First get the discussion
      const { data: discussion, error: discussionError } = await supabase
        .from('forum_discussions')
        .select('id')
        .eq('slug', discussionSlug)
        .single()

      if (discussionError) throw new Error('Discussion not found')
      if (!discussion) throw new Error('Discussion not found')

      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .insert([{
          title,
          discussionId: discussion.id,
          authorId: userId,
          lastMessageAt: new Date().toISOString()
        }])
        .select(`
          *,
          author:profiles (
            id,
            username,
            avatarUrl
          )
        `)
        .single()

      if (threadError) throw threadError
      return thread
    } catch (error) {
      console.error('[CREATE_THREAD]', error)
      throw error
    }
  }

  return {
    userId,
    isLoading,
    createThread
  }
} 