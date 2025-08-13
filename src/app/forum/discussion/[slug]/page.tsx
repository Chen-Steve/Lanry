import { Metadata } from 'next'
import { Suspense } from 'react'
import ThreadList from '../../_components/ThreadList'
import CreateThreadButton from '../../_components/CreateThreadButton'
import { createServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { Icon } from '@iconify/react'

interface DiscussionPageProps {
  params: {
    slug: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Discussion - Community Forum',
  description: 'Join the discussion and share your thoughts',
  other: {
    'Cache-Control': 'no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

async function DiscussionHeader({ slug }: { slug: string }) {
  const supabase = await createServerClient()
  
  const { data: discussion } = await supabase
    .from('forum_discussions')
    .select('title, description')
    .eq('slug', slug)
    .single()

  if (!discussion) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm md:text-base mb-4">
        <Link href="/forum" className="hover:text-foreground transition-colors">
          Forum
        </Link>
        <Icon icon="ph:caret-right-bold" className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
        <span className="text-foreground line-clamp-1">
          {discussion.title}
        </span>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
          {discussion.title}
        </h1>
        <p className="text-muted-foreground">
          {discussion.description}
        </p>
      </div>
    </>
  )
}

export default function DiscussionPage({ params }: DiscussionPageProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="blobs-container">
        <div className="blob left-[20%] top-[10%] w-[600px] h-[600px] opacity-30" />
        <div className="blob right-[20%] bottom-[10%] w-[600px] h-[600px] opacity-30" />
      </div>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Suspense fallback={null}>
          <DiscussionHeader slug={params.slug} />
        </Suspense>
        <div className="mb-8">
          <CreateThreadButton discussionSlug={params.slug} />
        </div>
        <Suspense fallback={null}>
          <ThreadList slug={params.slug} />
        </Suspense>
      </main>
    </div>
  )
} 