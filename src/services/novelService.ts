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

interface GetNovelsOptions {
  limit?: number;
  offset?: number;
  categories?: {
    included: string[];
    excluded: string[];
  };
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

export async function getNovels(options: GetNovelsOptions = {}): Promise<{ novels: Novel[]; total: number }> {
  try {
    const { limit = 24, offset = 0, categories } = options;
    
    let query = supabase
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
          age_rating,
          created_at
        ),
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        )
      `, { count: 'exact' });

    // Apply category filters if provided
    if (categories?.included && categories.included.length > 0) {
      query = query.contains('categories', categories.included);
    }
    if (categories?.excluded && categories.excluded.length > 0) {
      query = query.not('categories', 'cs', `{${categories.excluded.join(',')}}`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      novels: data?.map(novel => ({
        ...novel,
        coverImageUrl: novel.cover_image_url,
        translator: novel.translator ? {
          username: novel.translator.username,
          profile_id: novel.translator.id,
          kofiUrl: novel.translator.kofi_url,
          patreonUrl: novel.translator.patreon_url,
          customUrl: novel.translator.custom_url,
          customUrlLabel: novel.translator.custom_url_label,
          author_bio: novel.translator.author_bio
        } : null,
        categories: novel.categories?.map((item: { category: NovelCategory }) => item.category) || []
      })) || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching novels:', error);
    return { novels: [], total: 0 };
  }
}

export async function getNovelsWithRecentUnlocks(limit: number = 10): Promise<Novel[]> {
  try {
    const now = new Date().toISOString();
    
    // Get novels with chapters that were recently unlocked (publish date just passed)
    const { data: novels, error } = await supabase
      .from('novels')
      .select(`
        *,
        chapters!inner (
          id,
          chapter_number,
          part_number,
          title,
          publish_at,
          coins
        )
      `)
      .lt('chapters.publish_at', now) // Only get chapters that are now published
      .gt('chapters.publish_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Within last 7 days
      .gt('chapters.coins', 0) // Only chapters that required coins
      .order('chapters.publish_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Process and return novels
    return (novels || []).map(novel => ({
      ...novel,
      coverImageUrl: novel.cover_image_url,
      slug: novel.slug
    }));
  } catch (error) {
    console.error('Error fetching novels with recent unlocks:', error);
    return [];
  }
}