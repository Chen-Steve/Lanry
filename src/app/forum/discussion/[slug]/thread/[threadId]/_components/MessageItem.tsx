'use client'

import { forwardRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ForumMessage } from '@/types/forum'
import { Avatar } from '@/components/ui/avatar'

interface MessageItemProps {
  message: ForumMessage
  isLast?: boolean
}

const MessageItem = forwardRef<HTMLDivElement, MessageItemProps>(
  ({ message, isLast }, ref) => {
    return (
      <div
        ref={isLast ? ref : undefined}
        className="flex gap-4 p-4 rounded-lg bg-accent"
      >
        <Avatar
          src={message.author.avatar_url}
          username={message.author.username}
          size={40}
          className="w-10 h-10"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {message.author.username}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <time
              dateTime={message.created_at}
              className="text-sm text-muted-foreground"
            >
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            </time>
          </div>
          <div className="text-foreground whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    )
  }
)

MessageItem.displayName = 'MessageItem'

export default MessageItem 