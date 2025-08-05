import { Tag } from '@/types/database';
import supabase from '@/lib/supabaseClient';

export async function getTags(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

export async function getNovelTags(novelId: string): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags_on_novels')
      .select(`
        tag:tag_id (
          id,
          name,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('novel_id', novelId);

    if (error) throw error;
    const typedData = (data as unknown) as Array<{
      tag: {
        id: string;
        name: string;
        description?: string | null;
        created_at: string;
        updated_at: string;
      }
    }>;
    return (typedData || []).map(item => ({
      id: item.tag.id,
      name: item.tag.name,
      description: item.tag.description,
      created_at: item.tag.created_at,
      updated_at: item.tag.updated_at,
      usageCount: 0
    }));
  } catch (error) {
    console.error('Error fetching novel tags:', error);
    throw error;
  }
}

export async function addNovelTags(novelId: string, tagIds: string[]): Promise<boolean> {
  try {
    const rows = tagIds.map((tagId: string) => ({
      novel_id: novelId,
      tag_id: tagId,
    }));

    const { error } = await supabase
      .from('tags_on_novels')
      .upsert(rows, { onConflict: 'novel_id,tag_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding tags:', error);
    // Re-throw the error so the calling component can handle it properly
    throw error instanceof Error ? error : new Error('Failed to add tags');
  }
}

export async function removeNovelTag(novelId: string, tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tags_on_novels')
      .delete()
      .eq('novel_id', novelId)
      .eq('tag_id', tagId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing tag:', error);
    // Re-throw the error so the calling component can handle it properly
    throw error instanceof Error ? error : new Error('Failed to remove tag');
  }
}

export async function createTag(name: string, description?: string): Promise<Tag> {
  try {
    // Check if a tag with the same name already exists (case-insensitive)
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existingTag) {
      throw new Error('A tag with this name already exists');
    }

    // Create new tag
    const { data: tag, error } = await supabase
      .from('tags')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      usageCount: 0
    };
  } catch (error) {
    console.error('Error creating tag:', error);
    // Re-throw the error with the specific message
    throw error instanceof Error ? error : new Error('Failed to create tag');
  }
} 