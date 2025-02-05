export interface Novel {
  id: string;
  title: string;
  author_profile_id?: string;
  cover_image_url?: string;
  chaptersCount?: number;
}

export interface Volume {
  id: string;
  novel_id: string;
  title: string;
  volume_number: number;
  description?: string;
}

export interface Chapter {
  id: string;
  chapter_number: number;
  part_number?: number | null;
  title: string;
  content: string;
  novel_id: string;
  volume_id?: string;
  arc_id?: string;
  slug: string;
  publish_at?: string;
  coins?: number;
  created_at: string;
  updated_at: string;
  author_thoughts?: string;
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