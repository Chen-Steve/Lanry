import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ForumThread } from '@/types/forum'
import ThreadMessages from './_components/ThreadMessages'
import ThreadHeader from './_components/ThreadHeader'
import { prisma } from '@/lib/prisma'

interface ThreadPageProps {
  params: {
    slug: string
    threadId: string
  }
}

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies })

  const { data: thread } = await supabase
    .from('forum_threads')
    .select(`
      title,
      discussion:forum_discussions (
        title
      )
    `)
    .eq('id', params.threadId)
    .single() as { data: { title: string, discussion: { title: string } } }

  if (!thread) {
    return {
      title: 'Thread Not Found'
    }
  }

  return {
    title: `${thread.title} - ${thread.discussion.title} - Forum`
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const supabase = createServerComponentClient({ cookies })

  const { data: thread } = await supabase
    .from('forum_threads')
    .select(`
      *,
      author:profiles (
        id,
        username,
        avatar_url
      ),
      discussion:forum_discussions (
        id,
        title,
        slug
      )
    `)
    .eq('id', params.threadId)
    .single()

  if (!thread) {
    notFound()
  }

  // Update view count using Prisma instead of Supabase
  await prisma.forumThread.update({
    where: { id: params.threadId },
    data: {
      viewCount: {
        increment: 1
      }
    }
  })

  return (
    <main className="flex-1">
      <div className="mx-auto container max-w-5xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ThreadHeader thread={thread as ForumThread} />
        <ThreadMessages threadId={params.threadId} />
      </div>
    </main>
  )
} 