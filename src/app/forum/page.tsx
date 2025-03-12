import { Metadata } from 'next'
import DiscussionList from '@/app/forum/_components/DiscussionList'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Community Forum',
  description: 'Join our community discussions and share your thoughts',
  other: {
    'Cache-Control': 'no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="blobs-container">
        <div className="blob left-[20%] top-[10%] w-[600px] h-[600px] opacity-30" />
        <div className="blob right-[20%] bottom-[10%] w-[600px] h-[600px] opacity-30" />
      </div>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Suspense fallback={<DiscussionList />}>
          <DiscussionList />
        </Suspense>
      </main>
    </div>
  )
} 