export interface Chapter {
  id: string;
  title: string;
  content: string;
  novel_id: string;
  created_at: string;
  chapter_number: number;
  slug: string;
  novel?: Novel;
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
  bookmarks: number;
  isBookmarked: boolean;
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
  user_id: string;
  novel_id: string;
  last_chapter: number;
  last_read: string;
  created_at: string;
  novel: Novel;
}

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  current_streak: number;
  last_visit: string | null;
} 