import { Novel } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';

interface NovelWithChapters extends Novel {
  chapterCount: number;
}

export async function fetchAuthorNovels(): Promise<NovelWithChapters[]> {
  const { data: { session } } = await supabase.auth.getSession();
      
  if (!session?.user) {
    return [];
  }

  const { data: novels, error } = await supabase
    .from('novels')
    .select(`
      *,
      chapters (count),
      categories:categories_on_novels (
        category:category_id (
          id,
          name,
          created_at,
          updated_at
        )
      )
    `)
    .eq('author_profile_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  console.log('Raw novels data:', novels);

  return novels.map(novel => ({
    ...novel,
    categories: novel.categories?.map((item: { category: { id: string; name: string; created_at: string; updated_at: string } }) => item.category) || [],
    coverImageUrl: novel.cover_image_url,
    chapterCount: novel.chapters[0]?.count || 0
  }));
}

export function filterNovels(novels: NovelWithChapters[], searchQuery: string, statusFilter: string): NovelWithChapters[] {
  return novels.filter(novel => {
    const matchesSearch = novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         novel.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || novel.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export async function updateNovel(novel: Novel): Promise<Novel> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  // Validate required fields
  if (!novel.title?.trim()) throw new Error('Title is required');
  if (!novel.author?.trim()) throw new Error('Author is required');
  if (!novel.description?.trim()) throw new Error('Description is required');
  if (!novel.status) throw new Error('Status is required');

  // Generate slug from title
  const slug = novel.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!novel.id) {
    // Create new novel with exact database schema match and UUID
    const { data, error } = await supabase
      .from('novels')
      .insert({
        id: generateUUID(),
        title: novel.title.trim(),
        author: novel.author.trim(),
        description: novel.description.trim(),
        status: novel.status,
        slug,
        cover_image_url: novel.coverImageUrl || null,
        author_profile_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bookmark_count: 0,
        views: 0,
        rating: 0,
        rating_count: 0,
        is_author_name_custom: true
      })
      .select()
      .single();

    if (error) {
      console.error('Novel creation error:', error);
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A novel with this title already exists');
      }
      throw error;
    }
    return data;
  } else {
    // Update existing novel
    const { error } = await supabase
      .from('novels')
      .update({
        title: novel.title.trim(),
        author: novel.author.trim(),
        description: novel.description.trim(),
        status: novel.status,
        cover_image_url: novel.coverImageUrl || null,
        updated_at: new Date().toISOString(),
        is_author_name_custom: true
      })
      .eq('id', novel.id);

    if (error) throw error;
    return novel;
  }
} 