'use client'

import { forwardRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { ForumMessage } from '@/types/forum'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useForumMutations } from '@/hooks/forum/useForumMutations'
import { formatRelativeDate } from '@/lib/utils'
import MarkdownPreview from '@/app/forum/_components/MarkdownPreview'
import SimpleMarkdownEditor from '@/components/SimpleMarkdownEditor'

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
        setShowDeleteConfirm(false)
      } catch (error) {
        console.error('[DELETE_MESSAGE_ERROR]', error)
      }
    }

    const handleEdit = async () => {
      if (!editContent.trim()) return

      try {
        await updateMessage.mutateAsync({
          id: message.id,
          content: editContent.trim()
        })
        setIsEditing(false)
      } catch (error) {
        console.error('[UPDATE_MESSAGE_ERROR]', error)
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
                  {formatRelativeDate(message.created_at)}
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
              <SimpleMarkdownEditor
                value={editContent}
                onChange={setEditContent}
                disabled={updateMessage.isPending}
                className="min-h-[100px]"
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
              <MarkdownPreview 
                content={message.content}
                className="text-sm sm:text-base"
              />
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