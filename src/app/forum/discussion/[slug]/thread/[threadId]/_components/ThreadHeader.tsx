'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { ForumThread } from '@/types/forum'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useThreadMutations } from '@/hooks/forum/useThreadMutations'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ThreadHeaderProps {
  thread: ForumThread
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

export default function ThreadHeader({ thread }: ThreadHeaderProps) {
  const { userId } = useAuth()
  const { deleteThread } = useThreadMutations()
  const router = useRouter()
  const isOwner = userId === thread.author.id
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = async () => {
    try {
      const result = await deleteThread.mutateAsync(thread.id)
      toast.success('Thread deleted successfully')
      router.push(`/forum/discussion/${result.discussionSlug}`)
    } catch (error) {
      console.error('[DELETE_THREAD_ERROR]', error)
      toast.error('Failed to delete thread')
    } finally {
      setShowDeleteModal(false)
    }
  }

  return (
    <>
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
          {isOwner && (
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(true)}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              Delete Thread
            </Button>
          )}
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
            {formatDate(thread.createdAt)}
          </time>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Icon icon="ph:eye" className="w-4 h-4" />
            <span>{thread.viewCount}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Delete Thread</h2>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this thread? This action cannot be undone and will delete all messages in this thread.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={deleteThread.isPending}
              >
                {deleteThread.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 