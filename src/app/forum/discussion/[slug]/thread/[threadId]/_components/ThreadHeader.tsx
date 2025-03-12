import Link from 'next/link'
import { Icon } from '@iconify/react'
import { ForumThread } from '@/types/forum'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/avatar'

interface ThreadHeaderProps {
  thread: ForumThread
}

export default function ThreadHeader({ thread }: ThreadHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Link
          href="/forum"
          className="hover:text-foreground transition-colors"
        >
          Forum
        </Link>
        <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
        <Link
          href={`/forum/discussion/${thread.discussion.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {thread.discussion.title}
        </Link>
        <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
        <span className="text-foreground">{thread.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {thread.title}
        </h1>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar
            src={thread.author.avatarUrl}
            username={thread.author.username}
            size={20}
            className="w-5 h-5"
          />
          <span>{thread.author.username}</span>
        </div>
        <span>•</span>
        <time dateTime={thread.createdAt} className="text-muted-foreground">
          {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
        </time>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Icon icon="ph:eye" className="w-4 h-4" />
          <span>{thread.viewCount}</span>
        </div>
      </div>
    </div>
  )
} 