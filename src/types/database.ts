import { NovelStatus } from '@prisma/client';

export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  bookmarks: number;
  status: NovelStatus;
  createdAt: Date;
  updatedAt: Date;
  chapters: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
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
} 