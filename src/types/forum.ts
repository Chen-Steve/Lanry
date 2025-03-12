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
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_locked: boolean
  thread_count: number
  message_count: number
  last_message_at: string | null
}

export interface ForumThread {
  id: string
  title: string
  created_at: string
  updated_at: string
  discussion_id: string
  author_id: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  last_message_at: string
  discussion: {
    id: string
    title: string
    slug: string
  }
  author: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export interface ForumMessage {
  id: string
  content: string
  created_at: string
  updated_at: string
  thread_id: string
  author_id: string
  author: {
    id: string
    username: string
    avatar_url: string | null
  }
} 