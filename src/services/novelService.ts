import { Novel, Chapter, ChapterUnlock, NovelCategory } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';

interface NovelCharacterFromDB {
  id: string;
  name: string;
  role: string;
  image_url: string;
  description: string | null;
  order_index: number;
}

export async function getNovel(id: string, userId?: string): Promise<Novel | null> {
  try {
    const isNumericId = !isNaN(Number(id));
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        translator:author_profile_id (
          id,
          username,
          kofi_url,
          patreon_url,
          custom_url,
          custom_url_label,
          author_bio
        ),
        chapters (
          id,
          title,
          created_at,
          chapter_number,
          part_number,
          publish_at,
          coins,
          volume_id,
          age_rating
        ),
        volumes (
          id,
          title,
          volume_number,
          description
        ),
        bookmarks!left (
          id,
          profile_id
        ),
        chapter_unlocks!left (
          chapter_number,
          profile_id
        ),
        novel_ratings!left (
          rating,
          profile_id
        ),
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        ),
        tags:tags_on_novels!left (
          novel_id,
          tag_id,
          created_at,
          tag:tag_id (
            id,
            name,
            description
          )
        ),
        characters:novel_characters (
          id,
          name,
          role,
          image_url,
          description,
          order_index
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

    // Calculate ratings
    const ratings = data.novel_ratings || [];
    const ratingCount = ratings.length;
    const averageRating = ratingCount > 0
      ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratingCount
      : 0;

    // Get user's rating if they're logged in
    const userRating = userId && ratings.length > 0
      ? ratings.find((r: { profile_id: string; rating: number }) => r.profile_id === userId)?.rating
      : undefined;

    // Calculate bookmark count
    const bookmarkCount = data.bookmarks?.length || 0;

    // Process categories
    const categories = data.categories?.map((item: { category: NovelCategory }) => item.category) || [];

    // Process characters
    const characters = data.characters?.map((char: NovelCharacterFromDB) => ({
      id: char.id,
      name: char.name,
      role: char.role,
      imageUrl: char.image_url,
      description: char.description,
      orderIndex: char.order_index,
    })) || [];

    return {
      ...data,
      translator: data.translator ? {
        username: data.translator.username,
        profile_id: data.translator.id,
        kofiUrl: data.translator.kofi_url,
        patreonUrl: data.translator.patreon_url,
        customUrl: data.translator.custom_url,
        customUrlLabel: data.translator.custom_url_label,
        author_bio: data.translator.author_bio
      } : null,
      coverImageUrl: data.cover_image_url,
      isBookmarked: userId ? data.bookmarks?.some((b: { profile_id: string }) => b.profile_id === userId) : false,
      userRating,
      rating: averageRating,
      ratingCount,
      bookmarkCount,
      chapters,
      volumes: data.volumes || [],
      categories,
      tags: data.tags?.map((t: { tag: { id: string; name: string; description: string | null } }) => t.tag) || [],
      characters,
      ageRating: data.age_rating
    };
  } catch (error) {
    console.error('Error fetching novel:', error);
    return null;
  }
}

export async function toggleBookmark(novelId: string, userId: string, isCurrentlyBookmarked: boolean): Promise<boolean> {
  try {
    const isNumericId = !isNaN(Number(novelId));
    const { data: novelData, error: novelError } = await supabase
      .from('novels')
      .select('id, bookmark_count')
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(novelId) : novelId)
      .single();

    if (novelError || !novelData) {
      console.error('Error getting novel:', novelError);
      throw new Error('Novel not found');
    }

    if (isCurrentlyBookmarked) {
      // Delete bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('profile_id', userId)
        .eq('novel_id', novelData.id);

      if (error) throw error;

      // Update bookmark count
      await supabase
        .from('novels')
        .update({ 
          bookmark_count: Math.max(0, (novelData.bookmark_count || 0) - 1)
        })
        .eq('id', novelData.id);

      return false;
    } else {
      // Insert bookmark with UUID from our utility function
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          id: generateUUID(),
          profile_id: userId,
          novel_id: novelData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update bookmark count
      await supabase
        .from('novels')
        .update({ 
          bookmark_count: (novelData.bookmark_count || 0) + 1
        })
        .eq('id', novelData.id);

      return true;
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

export async function getNovels(): Promise<Novel[]> {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        translator:author_profile_id (
          id,
          username,
          kofi_url,
          patreon_url,
          custom_url,
          custom_url_label,
          author_bio
        ),
        chapters (
          id,
          title,
          chapter_number,
          part_number,
          publish_at,
          coins,
          volume_id,
          age_rating
        ),
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        ),
        tags:tags_on_novels!left (
          novel_id,
          tag_id,
          created_at,
          tag:tag_id (
            id,
            name,
            description
          )
        )
      `)
      .order('created_at', { ascending: false })
      .throwOnError();

    if (error || !data) return [];

    return data.map(novel => ({
      ...novel,
      translator: novel.translator ? {
        username: novel.translator.username,
        profile_id: novel.translator.id,
        kofiUrl: novel.translator.kofi_url,
        patreonUrl: novel.translator.patreon_url,
        customUrl: novel.translator.custom_url,
        customUrlLabel: novel.translator.custom_url_label,
        author_bio: novel.translator.author_bio
      } : null,
      coverImageUrl: novel.cover_image_url,
      categories: novel.categories?.map((item: { category: NovelCategory }) => item.category) || [],
      tags: novel.tags?.map((t: { tag: { id: string; name: string; description: string | null } }) => t.tag) || [],
      ageRating: novel.age_rating
    }));
  } catch (error) {
    console.error('Error in getNovels:', error);
    return [];
  }
}