import { Novel as DatabaseNovel } from '@/types/database';

export interface NovelEditFormProps {
  novel: DatabaseNovel;
  onCancel: () => void;
  onUpdate: (novel: DatabaseNovel) => void;
}

export interface ChapterListChapter {
  id: string;
  chapter_number: number;
  part_number?: number;
  title?: string;
  publish_at?: string | null;
  coins?: number;
  volumeId?: string | null;
}

export interface Volume {
  id: string;
  volumeNumber: number;
  title: string;
}

export interface ChapterListProps {
  chapters: ChapterListChapter[];
  volumes: Volume[];
  editingChapterId?: string;
  onChapterClick?: (chapter: ChapterListChapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onCreateVolume: (volumeData: { title: string; volumeNumber: number }) => void;
  onCreateChapter: (volumeId?: string) => void;
  novelId: string;
  userId: string;
  onLoadChapters?: () => Promise<void>;
}

export interface AuthorNovel extends Pick<DatabaseNovel, 
  'id' | 
  'title' | 
  'description' | 
  'coverImageUrl' | 
  'status' | 
  'slug' | 
  'author' |
  'author_profile_id'
> {
  chaptersCount?: number;
  categories?: {
    id: string;
    name: string;
  }[];
}

export interface AuthorChapter {
  id: string;
  chapter_number: number;
  part_number?: number | null;
  title: string;
  content: string;
  novel_id: string;
  slug: string;
  publish_at?: string;
  coins?: number;
  created_at: string;
  updated_at: string;
  author_thoughts?: string;
  volume_id?: string;
  arc_id?: string;
}

export interface AuthorVolume {
  id: string;
  novel_id: string;
  title: string;
  volume_number: number;
  description?: string;
}

export interface AuthorArc {
  id: string;
  novel_id: string;
  title: string;
  arc_number: number;
  description?: string;
  volume_id?: string;
}

export interface ChapterFormData {
  chapterNumber: string;
  partNumber: string;
  title: string;
  content: string;
  slug: string;
  publishAt: string;
  coins: string;
  authorThoughts: string;
  volumeId?: string;
  arcId?: string;
}

export interface NovelFormData {
  title: string;
  description: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  categories?: string[];
  coverImage?: File;
}

export interface NovelCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  novel_id: string;
  chapter_number?: number;
  paragraph_id?: string;
  user: {
    username: string;
    avatar_url: string;
  };
  chapter: {
    title: string;
    novel: {
      title: string;
      slug: string;
    };
  };
}

export interface SupabaseComment {
  id: string;
  content: string;
  created_at: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
    role: string;
  };
  chapter_number: number;
  novel_id: string;
  paragraph_id: string;
  novel: {
    title: string;
    author_profile_id: string;
  };
} 