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
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm md:text-base">
          <Link
            href="/forum"
            className="hover:text-foreground transition-colors"
          >
            Forum
          </Link>
          <Icon icon="ph:caret-right-bold" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link
            href={`/forum/discussion/${discussionSlug}`}
            className="hover:text-foreground transition-colors line-clamp-1"
          >
            {discussionTitle}
          </Link>
          <Icon icon="ph:caret-right-bold" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span className="text-foreground line-clamp-1">{thread.title}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex-1 min-w-0">
            {thread.title}
          </h1>

          {isOwner && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-md text-white bg-red-400 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 transition-colors flex-shrink-0 whitespace-nowrap"
            >
              Delete Thread
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar
              src={avatarUrl}
              username={thread.author.username}
              size={20}
              className="w-5 h-5"
            />
            <span className="line-clamp-1">{thread.author.username}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <time dateTime={'created_at' in thread ? thread.created_at : thread.createdAt} className="text-muted-foreground">
            {formatDate(thread)}
          </time>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <Icon icon="ph:eye" className="w-4 h-4" />
            <span>{viewCount}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Delete Thread</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this thread? This action cannot be undone and will delete all messages in this thread.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm font-medium border rounded-md text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium rounded-md text-white dark:text-red-50 bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleDelete}
                disabled={deleteThread.isPending}
              >
                {deleteThread.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 