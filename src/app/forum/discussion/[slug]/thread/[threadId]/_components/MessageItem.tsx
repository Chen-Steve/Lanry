'use client'

import { forwardRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { ForumMessage } from '@/types/forum'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useForumMutations } from '@/hooks/forum/useForumMutations'

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
    const { userId } = useAuth()
    const { deleteMessage } = useForumMutations()
    const isAuthor = userId === message.author_id
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleDelete = async () => {
      try {
        await deleteMessage.mutateAsync(message.id)
        toast.success('Message deleted successfully')
        setShowDeleteConfirm(false)
      } catch (error) {
        console.error('[DELETE_MESSAGE_ERROR]', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
          toast.error('Please sign in to delete this message')
        } else {
          toast.error('Failed to delete message')
        }
      }
    }

    return (
      <>
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
              {isAuthor && (
                <button
                  type="button"
                  className="ml-auto flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteMessage.isPending}
                >
                  <Icon icon="lucide:trash-2" className="h-4 w-4" />
                  <span className="sr-only">Delete message</span>
                </button>
              )}
            </div>
            <div className="text-foreground whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-4 shadow-lg max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium mb-2">Delete Message</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMessage.isPending}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
)

MessageItem.displayName = 'MessageItem'

export default MessageItem 