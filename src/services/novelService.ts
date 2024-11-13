import { Novel, Chapter } from '@/types/database';
import supabase from '@/lib/supabaseClient';

export async function getNovel(id: string, userId?: string): Promise<Novel | null> {
  try {
    const isNumericId = !isNaN(Number(id));
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        chapters (
          id,
          title,
          created_at,
          chapter_number,
          publish_at
        ),
        bookmarks!left (
          id,
          profile_id
        )
      `)
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(id) : id)
      .single()
      .throwOnError();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const novel = {
      ...data,
      coverImageUrl: data.cover_image_url,
      bookmarks: data.bookmarks?.length ?? 0,
      isBookmarked: userId ? data.bookmarks?.some((b: { profile_id: string }) => b.profile_id === userId) ?? false : false,
      chapters: (data.chapters ?? []).sort((a: Chapter, b: Chapter) => 
        a.chapter_number - b.chapter_number
      )
    };

    return novel;
  } catch (error) {
    console.error('Detailed error in getNovel:', error);
    return null;
  }
}

export async function toggleBookmark(novelId: string, userId: string, isCurrentlyBookmarked: boolean): Promise<boolean> {
  try {
    const isNumericId = !isNaN(Number(novelId));
    const { data: novelData, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(novelId) : novelId)
      .single();

    if (novelError || !novelData) {
      console.error('Error getting novel:', novelError);
      throw new Error('Novel not found');
    }

    const actualNovelId = novelData.id;

    if (isCurrentlyBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('profile_id', userId)
        .eq('novel_id', actualNovelId);

      if (error) throw error;
      return false; // Returns new bookmark state
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          profile_id: userId,
          novel_id: actualNovelId,
        });

      if (error) throw error;
      return true; // Returns new bookmark state
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}