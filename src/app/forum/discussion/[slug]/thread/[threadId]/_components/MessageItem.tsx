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
    const { deleteMessage, updateMessage } = useForumMutations()
    const isAuthor = userId === message.author_id
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(message.content)

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

    const handleEdit = async () => {
      if (!editContent.trim()) {
        toast.error('Message cannot be empty')
        return
      }

      try {
        await updateMessage.mutateAsync({
          id: message.id,
          content: editContent.trim()
        })
        setIsEditing(false)
        toast.success('Message updated successfully')
      } catch (error) {
        console.error('[UPDATE_MESSAGE_ERROR]', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
          toast.error('Please sign in to edit this message')
        } else {
          toast.error('Failed to update message')
        }
      }
    }

    return (
      <>
        <div
          ref={isLast ? ref : undefined}
          className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-accent"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <Avatar
              src={message.author.avatar_url}
              username={message.author.username}
              size={32}
              className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-foreground truncate">
                  {message.author.username}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">•</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {formatDate(message.created_at)}
                </span>
                {message.is_edited && (
                  <>
                    <span className="text-xs sm:text-sm text-muted-foreground">•</span>
                    <span className="text-xs sm:text-sm text-muted-foreground italic">
                      edited
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[100px] p-2 rounded-md bg-background border resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                placeholder="Edit your message..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }}
                  className="px-2.5 py-1.5 text-sm rounded-md hover:bg-accent/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={updateMessage.isPending}
                  className="px-2.5 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updateMessage.isPending ? (
                    <>
                      <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                {message.content}
              </div>
              {isAuthor && (
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing || deleteMessage.isPending}
                  >
                    <Icon icon="lucide:edit-2" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Edit message</span>
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteMessage.isPending}
                  >
                    <Icon icon="lucide:trash-2" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Delete message</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-background rounded-lg p-4 shadow-lg max-w-sm w-full mx-4 border border-border">
              <h3 className="text-base sm:text-lg font-medium mb-2">Delete Message</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMessage.isPending}
                  className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteMessage.isPending ? (
                    <>
                      <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete'
                  )}
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