'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useThreadMutations } from '@/hooks/forum/useThreadMutations'

interface CreateThreadButtonProps {
  discussionSlug: string
}

export default function CreateThreadButton({ discussionSlug }: CreateThreadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { createThread } = useThreadMutations()

  const handleCreateClick = async () => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    try {
      const thread = await createThread.mutateAsync({
        title: title.trim(),
        discussionSlug
      })
      
      router.push(`/forum/discussion/${discussionSlug}/thread/${thread.id}`)
    } catch (error) {
      console.error('[CREATE_THREAD_ERROR]', error)
      if (error instanceof Error && error.message === 'Unauthorized') {
        router.push('/auth')
      }
    } finally {
      setIsOpen(false)
      setTitle('')
    }
  }

  return (
    <>
      <button
        onClick={handleCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Icon icon="ph:plus-bold" className="w-5 h-5" />
        <span>Create Thread</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
            <div className="bg-accent shadow-sm rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Create New Thread</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Close modal"
                >
                  <Icon icon="ph:x-bold" className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Thread Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter thread title..."
                    className="w-full px-4 py-2 bg-secondary text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    disabled={createThread.isPending}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={createThread.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createThread.isPending || !title.trim()}
                  >
                    {createThread.isPending ? 'Creating...' : 'Create Thread'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 