'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'

export function useForum() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          if (session?.user) {
            setUserId(session.user.id)
          } else {
            setUserId(null)
          }
        }
      } catch (error) {
        console.error('[Init] Error:', error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUserId(null)
      } else if (session?.user) {
        setUserId(session.user.id)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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