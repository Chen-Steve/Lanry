export interface Novel {
  id: string;
  title: string;
  author_profile_id?: string;
}

export interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  novel_id: string;
  slug: string;
  publish_at?: string;
  coins?: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterFormData {
  chapterNumber: string;
  title: string;
  content: string;
  slug: string;
  publishAt: string;
  coins: string;
} 