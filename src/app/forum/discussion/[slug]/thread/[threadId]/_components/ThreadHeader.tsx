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
  thread: ForumThread | SupabaseThread
}

// Interface to handle Supabase's snake_case properties
interface SupabaseThread {
  id: string
  title: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  view_count?: number
  author: {
    id: string
    username: string
    avatar_url?: string | null
  }
  discussion: {
    id: string
    title: string
    slug: string
  }
}

const formatDate = (thread: ForumThread | SupabaseThread) => {
  try {
    // Get the date string, handling both created_at and createdAt
    const dateString = 'created_at' in thread && thread.created_at
      ? thread.created_at
      : thread.createdAt
    
    if (!dateString) {
      console.error('Date string is missing', thread)
      return 'Invalid date'
    }
    
    // Parse the date - ensure it's treated as UTC if it doesn't have timezone info
    let date: Date
    if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) {
      // If the date string doesn't have timezone info, treat it as UTC
      date = new Date(dateString + 'Z')
    } else {
      date = new Date(dateString)
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date format', dateString)
      return 'Invalid date'
    }

    // Use the same formatting as ThreadList
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
  
  // Handle both camelCase and snake_case
  const authorId = 'authorId' in thread ? thread.authorId : thread.author.id
  const isOwner = userId === authorId
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

  // Get the discussion slug
  const discussionSlug = thread.discussion.slug
  
  // Get the discussion title
  const discussionTitle = thread.discussion.title
  
  // Get the avatar URL
  const avatarUrl = 'avatarUrl' in thread.author 
    ? thread.author.avatarUrl 
    : (thread.author as SupabaseThread['author']).avatar_url || null
  
  // Get the view count
  const viewCount = 'viewCount' in thread ? thread.viewCount : thread.view_count

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
            href={`/forum/discussion/${discussionSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {discussionTitle}
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
              src={avatarUrl}
              username={thread.author.username}
              size={20}
              className="w-5 h-5"
            />
            <span>{thread.author.username}</span>
          </div>
          <span>•</span>
          <time dateTime={'created_at' in thread ? thread.created_at : thread.createdAt} className="text-muted-foreground">
            {formatDate(thread)}
          </time>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Icon icon="ph:eye" className="w-4 h-4" />
            <span>{viewCount}</span>
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