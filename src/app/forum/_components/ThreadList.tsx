'use client'

import { Icon } from '@iconify/react'
import { useThreads } from '@/hooks/forum/useThreads'
import { ForumThread } from '@/types/forum'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useThreadMutations } from '@/hooks/forum/useThreadMutations'
import { useState } from 'react'

interface ThreadListProps {
  slug: string
}

export default function ThreadList({ slug }: ThreadListProps) {
  const { data, isLoading, error } = useThreads(slug)
  const { userId } = useAuth()
  const { deleteThread } = useThreadMutations()
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault() // Prevent navigation
    if (deletingThreadId) return // Prevent multiple clicks

    try {
      setDeletingThreadId(threadId)
      await deleteThread.mutateAsync(threadId)
    } catch (error) {
      console.error('[DELETE_THREAD_ERROR]', error)
    } finally {
      setDeletingThreadId(null)
    }
  }

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
      {!data?.threads.length ? (
        <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border p-8 text-center">
          <Icon icon="ph:chat-centered-dots" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No threads yet</h3>
        </div>
      ) : (
        <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border divide-y divide-border">
          {data.threads.map((thread: ForumThread) => (
            <div key={thread.id} className="block p-4 hover:bg-secondary/50 transition-colors relative">
              <Link
                href={`/forum/discussion/${slug}/thread/${thread.id}`}
                className="block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {thread.isPinned && (
                      <Icon icon="ph:push-pin-fill" className="w-3.5 h-3.5 text-primary" />
                    )}
                    <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                      {thread.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                    </span>
                    {userId === thread.author.id && (
                      <button
                        onClick={(e) => handleDelete(e, thread.id)}
                        disabled={deletingThreadId === thread.id}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete thread"
                      >
                        {deletingThreadId === thread.id ? (
                          <Icon icon="ph:spinner" className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon icon="ph:trash" className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center mr-1.5">
                        {thread.author.avatarUrl ? (
                          <img
                            src={thread.author.avatarUrl}
                            alt={thread.author.username}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <Icon icon="ph:user" className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span>{thread.author.username}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Icon icon="ph:chat-circle-dots" className="w-3.5 h-3.5" />
                      <span>{thread._count?.messages || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon icon="ph:eye" className="w-3.5 h-3.5" />
                      <span>{thread.viewCount}</span>
                    </div>
                    {thread.isLocked && (
                      <Icon icon="ph:lock-simple-fill" className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 