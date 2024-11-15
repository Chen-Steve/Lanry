import { Novel, Chapter, ChapterUnlock } from '@/types/database';
import supabase from '@/lib/supabaseClient';

export async function getNovel(id: string, userId?: string): Promise<Novel | null> {
  try {
    const isNumericId = !isNaN(Number(id));
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        translator:author_profile_id (
          username
        ),
        chapters (
          id,
          title,
          created_at,
          chapter_number,
          publish_at,
          coins
        ),
        bookmarks!left (
          id,
          profile_id
        ),
        chapter_unlocks!left (
          chapter_number,
          profile_id
        )
      `)
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(id) : id)
      .single()
      .throwOnError();

    if (error || !data) return null;

    // Process chapters to include unlock status
    const chapters = (data.chapters || []).map((chapter: Chapter) => ({
      ...chapter,
      isUnlocked: userId ? 
        data.chapter_unlocks?.some((unlock: ChapterUnlock) => 
          unlock.chapter_number === chapter.chapter_number && 
          unlock.profile_id === userId
        ) : false
    })).sort((a: Chapter, b: Chapter) => a.chapter_number - b.chapter_number);

    return {
      ...data,
      translator: data.translator ? {
        username: data.translator.username
      } : undefined,
      coverImageUrl: data.cover_image_url,
      bookmarkCount: data.bookmarks?.length ?? 0,
      isBookmarked: userId ? data.bookmarks?.some((b: { profile_id: string }) => b.profile_id === userId) ?? false : false,
      chapters
    };
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
          id: crypto.randomUUID(),
          profile_id: userId,
          novel_id: actualNovelId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true; // Returns new bookmark state
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}