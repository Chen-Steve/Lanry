'use client'

import { Icon } from '@iconify/react'
import { useDiscussions } from '@/hooks/forum/useDiscussions'
import { ForumDiscussion } from '@/types/forum'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function DiscussionList() {
  const { data, isLoading, error } = useDiscussions()

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Forum Discussions</h2>
          <div className="relative w-[24rem]">
            <input
              type="text"
              placeholder="Search discussions..."
              className="w-full pl-11 pr-4 py-2 bg-secondary text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              disabled
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icon icon="ph:magnifying-glass-bold" className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-secondary/50 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-secondary/50 animate-pulse rounded w-24" />
              </div>
              <div className="h-4 bg-secondary/50 animate-pulse rounded w-full mb-4" />
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
        <h3 className="text-lg font-medium text-foreground">Failed to load discussions</h3>
        <p className="text-muted-foreground mt-2">Please try again later</p>
      </div>
    )
  }

  if (!data?.discussions.length) {
    return (
      <div className="text-center py-8">
        <Icon icon="ph:chat-centered-dots" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">No discussions yet</h3>
        <p className="text-muted-foreground mt-2">Be the first to start a discussion!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Forum Discussions</h2>
        <div className="relative w-[24rem]">
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full pl-11 pr-4 py-2 bg-secondary text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon icon="ph:magnifying-glass-bold" className="w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="bg-accent/80 backdrop-blur-sm shadow-sm rounded-lg border border-border divide-y divide-border">
        {data.discussions.map((discussion: ForumDiscussion) => (
          <Link
            key={discussion.id}
            href={`/forum/discussion/${discussion.slug}`}
            className="block p-6 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {discussion.isPinned && (
                  <Icon icon="ph:push-pin-fill" className="w-4 h-4 text-primary" />
                )}
                <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                  {discussion.title}
                </h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(discussion.updatedAt), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground line-clamp-2">{discussion.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {discussion.threads[0]?.author && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mr-2">
                      {discussion.threads[0].author.avatarUrl ? (
                        <img
                          src={discussion.threads[0].author.avatarUrl}
                          alt={discussion.threads[0].author.username}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <Icon icon="ph:user" className="w-4 h-4" />
                      )}
                    </div>
                    <span>{discussion.threads[0].author.username}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon icon="ph:chat-circle-dots" className="w-4 h-4" />
                  <span>{discussion._count?.threads || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="ph:eye" className="w-4 h-4" />
                  <span>{discussion.viewCount}</span>
                </div>
                {discussion.isLocked && (
                  <Icon icon="ph:lock-simple-fill" className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 