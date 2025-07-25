import { Volume } from './novel';

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
  isLocked?: boolean;
  author_profile_id: string;
  author_thoughts?: string;
  volume_id?: string;
  age_rating: 'EVERYONE' | 'TEEN' | 'MATURE';
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';
  ageRating: 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';
  created_at: string;
  updated_at: string;
  slug: string;
  chapters: Chapter[];
  volumes?: Volume[];
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
  tags?: Tag[];
  chapterCount?: number;
  characters?: {
    id: string;
    name: string;
    role: string;
    imageUrl: string;
    description?: string | null;
    orderIndex: number;
  }[];
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
export interface UserProfile {
  id: string;
  username: string | null;
  last_visit: string | null;
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  coins: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  wise_tag?: string | null;
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
  hasTranslatorAccess?: boolean;
  authorProfile?: {
    username: string;
    avatar_url?: string;
    role: 'AUTHOR' | 'TRANSLATOR'| 'USER';
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
    author_bio?: string;
  };
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

export type CategoryBasicInfo = {
  id: string;
  name: string;
  description: string;
  thread_count: number;
  latest_thread: string | null;
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

export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
} 