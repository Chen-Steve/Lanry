export interface Novel {
  id: string;
  created_at: string;
  title: string;
  author: string;
  description: string;
  cover_image_url?: string;
  status: 'ongoing' | 'completed' | 'hiatus';
}

export interface Chapter {
  id: string;
  created_at: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
} 