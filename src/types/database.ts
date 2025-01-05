export interface Chapter {
  id: string;
  title: string;
  content: string;
  novel_id: string;
  created_at: string;
  chapter_number: number;
  part_number?: number | null;
  slug: string;
  publish_at?: string;
  coins: number;
  novel?: Novel;
  isUnlocked?: boolean;
  author_profile_id: string;
  author_thoughts?: string;
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
  rating: number;
  ratingCount: number;
  isBookmarked?: boolean;
  userRating?: number;
  chapterUnlocks?: ChapterUnlock[];
  author_profile_id: string;
  translator_id?: string;
  is_author_name_custom?: boolean;
  categories?: NovelCategory[];
  translator?: {
    username: string | null;
    profile_id: string;
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
  } | null;
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
  username: string | null;
  current_streak: number;
  last_visit: string | null;
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
  coins: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
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
  reply_count: number;
  latest_activity: string;
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
  parent_post_id?: string | null;
  parent_author?: {
    username: string;
  } | null;
}

export type CategoryBasicInfo = {
  id: string;
  name: string;
  description: string;
  thread_count: number;
  latest_thread: string | null;
};

export type NovelRequest = {
  id: string;
  title: string;
  author: string;
  description: string;
  originalLanguage: string;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  profileId: string;
  voteCount: number;
  hasVoted: boolean;
  profile?: {
    username: string | null;
  };
};

export interface NovelComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  novel_id: string;
  profile: {
    username: string | null;
  };
}

export interface NovelRating {
  id: string;
  created_at: string;
  updated_at: string;
  rating: number;
  profile_id: string;
  novel_id: string;
  profile?: UserProfile;
  novel?: Novel;
}

export interface NovelCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
} 