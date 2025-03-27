'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useAuth } from '@/hooks/useAuth'
import { useForumMutations } from '@/hooks/forum/useForumMutations'
import { Button } from '@/components/ui/button'

interface CreateMessageProps {
  threadId: string
}

export default function CreateMessage({ threadId }: CreateMessageProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { createMessage } = useForumMutations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    setIsSubmitting(true)
    try {
      await createMessage.mutateAsync({
        threadId,
        content: content.trim()
      })
      setContent('')
    } catch (error) {
      console.error('[CREATE_MESSAGE_ERROR]', error)
      if (error instanceof Error && error.message === 'Unauthorized') {
        router.push('/auth')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Button 
        onClick={() => router.push('/auth')} 
        variant="outline"
        className="flex items-center gap-2 w-full justify-center p-4"
      >
        <Icon icon="mdi:login" className="text-lg" />
        Sign in to join the discussion
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your message..."
        className="w-full min-h-[100px] p-3 bg-background text-foreground placeholder:text-muted-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y"
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-2">
        {content.trim() && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setContent('')}
            disabled={isSubmitting}
            className="h-9 px-3 flex items-center gap-1.5"
          >
            <Icon icon="mdi:close" className="text-lg" />
            <span>Clear</span>
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="h-9 px-3 flex items-center gap-1.5"
        >
          <Icon icon="mdi:send" className="text-lg" />
          <span>{isSubmitting ? 'Posting...' : 'Post Message'}</span>
        </Button>
      </div>
    </form>
  )
} 