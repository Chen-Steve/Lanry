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
  translator_id?: string;
  translator?: {
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