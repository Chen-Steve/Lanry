export interface Chapter {
  id: string;
  title: string;
  content: string;
  novel_id: string;
  created_at: string;
  chapter_number: number;
  slug: string;
  publish_at?: string;
  coins: number;
  novel?: Novel;
  isUnlocked?: boolean;
  author_profile_id: string;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  created_at: string;
  updated_at: string;
  slug: string;
  chapters: Chapter[];
  bookmarkCount: number;
  views: number;
  isBookmarked?: boolean;
  chapterUnlocks?: ChapterUnlock[];
  author_profile_id: string;
  translator_id?: string;
  translator?: {
    id: string;
    username: string;
  };
}

export interface ChapterUnlock {
  id: string;
  profile_id: string;
  novel_id: string;
  chapter_number: number;
  cost: number;
  created_at: string;
  profile?: UserProfile;
  novel?: Novel;
}

export interface Bookmark {
  id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
  novel: Novel;
}

export interface ReadingHistory {
  id: string;
  profile_id: string;
  novel_id: string;
  last_chapter: number;
  last_read: string;
  created_at: string;
  updated_at: string;
  novel: Novel;
}

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
  role: 'USER' | 'ADMIN' | 'AUTHOR';
  transactions?: CoinTransaction[];
  chapterUnlocks?: ChapterUnlock[];
}

export interface ChapterComment {
  id: string;
  created_at: string;
  updated_at: string;
  novel_id: string;
  chapter_number: number;
  paragraph_id: string;
  content: string;
  profile_id: string;
  profile: {
    username: string;
  };
}

export interface CommentsByParagraph {
  [paragraphId: string]: ChapterComment[];
}

export type ChapterWithNovel = Chapter & {
  novel: Novel;
};

export interface CoinTransaction {
  id: string;
  created_at: string;
  profile_id: string;
  amount: number;
  type: string;
  order_id?: string;
  profile?: UserProfile;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
  thread_count: number;
  latest_thread?: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  post_count: number;
  last_post_at: string;
  author: {
    username: string;
  };
  score: number;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  author: {
    username: string;
  };
  score: number;
}

export type CategoryBasicInfo = {
  id: string;
  name: string;
  description: string;
  thread_count: number;
  latest_thread: string | null;
}; 