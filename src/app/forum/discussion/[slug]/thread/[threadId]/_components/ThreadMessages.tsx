'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ForumMessage } from '@/types/forum'
import MessageItem from './MessageItem'
import CreateMessage from './CreateMessage'
import { Icon } from '@iconify/react'

interface ThreadMessagesProps {
  threadId: string
}

const PAGE_SIZE = 20

export default function ThreadMessages({ threadId }: ThreadMessagesProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['forum', 'messages', threadId],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        threadId,
        page: String(pageParam + 1),
        limit: String(PAGE_SIZE)
      })
      const res = await fetch(`/api/forum/messages?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch messages')
      const json: { messages: ForumMessage[] } = await res.json()
      return json.messages
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined
    },
    initialPageParam: 0
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin">
            <Icon icon="lucide:loader-2" className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2 text-destructive">
          <Icon icon="lucide:alert-circle" className="w-6 h-6" />
          <p className="text-sm">Error loading messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        {data.pages.map((page, i) => (
          page.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isLast={i === data.pages.length - 1 && index === page.length - 1}
              ref={i === data.pages.length - 1 && index === page.length - 1 ? loadMoreRef : undefined}
            />
          ))
        ))}
        {isFetchingNextPage && (
          <div className="flex justify-center p-4">
            <div className="animate-spin">
              <Icon icon="lucide:loader-2" className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
      <CreateMessage threadId={threadId} />
    </div>
  )
} 