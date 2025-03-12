'use client'

import { Icon } from '@iconify/react'
import { useThreads } from '@/hooks/forum/useThreads'
import { ForumThread } from '@/types/forum'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface ThreadListProps {
  slug: string
}

export default function ThreadList({ slug }: ThreadListProps) {
  const { data, isLoading, error } = useThreads(slug)

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Loading...</h2>
        </div>
        <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-secondary/50 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-secondary/50 animate-pulse rounded w-24" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-secondary/50 animate-pulse rounded-full" />
                <div className="h-4 bg-secondary/50 animate-pulse rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Icon icon="ph:warning-circle" className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">Failed to load threads</h3>
        <p className="text-muted-foreground mt-2">Please try again later</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{data.discussion.title}</h1>
          <p className="text-muted-foreground mt-2">{data.discussion.description}</p>
        </div>
      </div>
      
      {!data?.threads.length ? (
        <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border p-8 text-center">
          <Icon icon="ph:chat-centered-dots" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No threads yet</h3>
        </div>
      ) : (
        <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border divide-y divide-border">
          {data.threads.map((thread: ForumThread) => (
            <Link
              key={thread.id}
              href={`/forum/discussion/${slug}/thread/${thread.id}`}
              className="block p-6 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {thread.isPinned && (
                    <Icon icon="ph:push-pin-fill" className="w-4 h-4 text-primary" />
                  )}
                  <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    {thread.title}
                  </h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mr-2">
                      {thread.author.avatarUrl ? (
                        <Image
                          src={thread.author.avatarUrl}
                          alt={thread.author.username}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <Icon icon="ph:user" className="w-4 h-4" />
                      )}
                    </div>
                    <span>{thread.author.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon icon="ph:chat-circle-dots" className="w-4 h-4" />
                    <span>{thread._count?.messages || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="ph:eye" className="w-4 h-4" />
                    <span>{thread.viewCount}</span>
                  </div>
                  {thread.isLocked && (
                    <Icon icon="ph:lock-simple-fill" className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 