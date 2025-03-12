'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ForumMessage } from '@/types/forum'
import supabase from '@/lib/supabaseClient'
import MessageItem from './MessageItem'
import CreateMessage from './CreateMessage'

interface ThreadMessagesProps {
  threadId: string
}

const PAGE_SIZE = 20

export default function ThreadMessages({ threadId }: ThreadMessagesProps) {
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['forum', 'messages', threadId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: messages, error } = await supabase
        .from('forum_messages')
        .select(`
          *,
          author:profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

      if (error) throw error
      return messages as ForumMessage[]
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined
    },
    initialPageParam: 0
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (status === 'pending') {
    return <div>Loading...</div>
  }

  if (status === 'error') {
    return <div>Error loading messages</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {data.pages.map((page, i) => (
          page.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isLast={i === data.pages.length - 1 && index === page.length - 1}
              ref={i === data.pages.length - 1 && index === page.length - 1 ? ref : undefined}
            />
          ))
        ))}
      </div>
      <CreateMessage threadId={threadId} />
    </div>
  )
} 