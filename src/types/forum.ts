export interface ForumCategory {
  id: string
  name: string
  description: string
  slug: string
  order: number
  _count: {
    discussions: number
  }
  discussions: ForumDiscussion[]
}

export interface ForumDiscussion {
  id: string
  title: string
  slug: string
  description: string
  createdAt: string
  updatedAt: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  threads: ForumThread[]
  _count?: {
    threads: number
  }
}

export interface ForumThread {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  discussionId: string
  authorId: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  lastMessageAt: string
  discussion: {
    id: string
    title: string
    slug: string
  }
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  _count?: {
    messages: number
  }
}

export interface ForumMessage {
  id: string
  content: string
  created_at: string
  updated_at: string
  thread_id: string
  author_id: string
  is_edited: boolean
  author: {
    id: string
    username: string
    avatar_url: string | null
  }
} 