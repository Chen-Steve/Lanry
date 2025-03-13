'use client'

import { forwardRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ForumMessage } from '@/types/forum'
import { Avatar } from '@/components/ui/avatar'

const formatDate = (dateString: string) => {
  try {
    if (!dateString) {
      console.error('Date string is missing')
      return 'Invalid date'
    }
    
    // Parse the date - ensure it's treated as UTC if it doesn't have timezone info
    let date: Date
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      // If the date string doesn't have timezone info, treat it as UTC
      date = new Date(dateString + 'Z')
    } else {
      date = new Date(dateString)
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date format', dateString)
      return 'Invalid date'
    }

    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

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
            <span className="text-sm text-muted-foreground">
              {formatDate(message.created_at)}
            </span>
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