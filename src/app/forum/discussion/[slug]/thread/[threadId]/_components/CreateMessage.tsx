'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useForumMutations } from '@/hooks/forum/useForumMutations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CreateMessageProps {
  threadId: string
}

export default function CreateMessage({ threadId }: CreateMessageProps) {
  const [content, setContent] = useState('')
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

    try {
      await createMessage.mutateAsync({
        threadId,
        content: content.trim()
      })
      setContent('')
      toast.success('Message posted successfully')
    } catch (error) {
      console.error('[CREATE_MESSAGE_ERROR]', error)
      if (error instanceof Error && error.message === 'Unauthorized') {
        toast.error('Please sign in to post a message')
        router.push('/auth')
      } else {
        toast.error('Failed to post message. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your message..."
        className="min-h-[100px]"
        disabled={createMessage.isPending}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={createMessage.isPending || !content.trim()}
        >
          {createMessage.isPending ? 'Posting...' : 'Post Message'}
        </Button>
      </div>
    </form>
  )
} 