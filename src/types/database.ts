export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
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