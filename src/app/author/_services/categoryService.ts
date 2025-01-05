import { NovelCategory } from '@/types/database';
import supabase from '@/lib/supabaseClient';

export async function getCategories(): Promise<NovelCategory[]> {
  try {
    const { data, error } = await supabase
      .from('novel_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function addNovelCategories(novelId: string, categoryIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('categories_on_novels')
      .insert(
        categoryIds.map(categoryId => ({
          novel_id: novelId,
          category_id: categoryId,
        }))
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding categories to novel:', error);
    return false;
  }
}

export async function removeNovelCategory(novelId: string, categoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('categories_on_novels')
      .delete()
      .match({ novel_id: novelId, category_id: categoryId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing category from novel:', error);
    return false;
  }
}

export async function getNovelCategories(novelId: string): Promise<NovelCategory[]> {
  try {
    const { data, error } = await supabase
      .from('categories_on_novels')
      .select(`
        category:category_id (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('novel_id', novelId);

    if (error) throw error;
    const typedData = (data as unknown) as Array<{
      category: {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
      }
    }>;
    return (typedData || []).map(item => ({
      id: item.category.id,
      name: item.category.name,
      created_at: item.category.created_at,
      updated_at: item.category.updated_at
    }));
  } catch (error) {
    console.error('Error fetching novel categories:', error);
    return [];
  }
} 