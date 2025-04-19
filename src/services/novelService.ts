import { Novel, Chapter, ChapterUnlock, NovelCategory } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';
import { cache } from 'react';

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

export const getCachedNovels = cache(async (options: GetNovelsOptions = {}): Promise<{ novels: Novel[]; total: number }> => {
  return getNovels(options);
});

export async function getNovels(options: GetNovelsOptions = {}): Promise<{ novels: Novel[]; total: number }> {
  try {
    const { limit = 12, offset = 0, categories } = options;
    
    // First get all novels count and IDs
    const { data: allNovels, count: totalCount } = await supabase
      .from('novels')
      .select('id', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (!allNovels) {
      return { novels: [], total: 0 };
    }

    const now = new Date().toISOString();

    // Get the latest chapter dates and recently unlocked chapters
    const [{ data: latestChapters }, { data: recentUnlocks }] = await Promise.all([
      supabase
        .from('chapters')
        .select('novel_id, created_at, title')
        .order('created_at', { ascending: false }),
      supabase
        .from('chapters')
        .select('novel_id, publish_at')
        .lte('publish_at', now) // Get chapters that just became available
        .gt('publish_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Within last 7 days
    ]);

    // Create a map of novel IDs to their latest activity (either chapter creation or unlock)
    const novelActivityMap = new Map<string, Date>();

    // Add chapters based on creation date
    latestChapters?.forEach(chapter => {
      const currentDate = novelActivityMap.get(chapter.novel_id);
      const chapterDate = new Date(chapter.created_at);
      if (!currentDate || chapterDate > currentDate) {
        novelActivityMap.set(chapter.novel_id, chapterDate);
      }
    });

    // Add recently unlocked chapters
    recentUnlocks?.forEach(chapter => {
      const currentDate = novelActivityMap.get(chapter.novel_id);
      const unlockDate = new Date(chapter.publish_at);
      if (!currentDate || unlockDate > currentDate) {
        novelActivityMap.set(chapter.novel_id, unlockDate);
      }
    });

    // Convert map to array and sort by date
    const orderedNovelIds = Array.from(novelActivityMap.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .map(([id]) => id);
    
    // Get all novel IDs that are not in orderedNovelIds
    const novelsWithoutActivity = allNovels
      .filter(novel => !orderedNovelIds.includes(novel.id))
      .map(novel => novel.id);
    
    // Combine IDs, putting novels with activity first
    const allNovelIds = [...orderedNovelIds, ...novelsWithoutActivity];

    // Then fetch the full novel data in the correct order
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
      `);

    // Apply category filters if provided
    if (categories?.included && categories.included.length > 0) {
      query = query.contains('categories', categories.included);
    }
    if (categories?.excluded && categories.excluded.length > 0) {
      query = query.not('categories', 'cs', `{${categories.excluded.join(',')}}`);
    }

    // Only apply ID filtering if we have novels
    if (allNovelIds.length > 0) {
      query = query.in('id', allNovelIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Sort the novels to match the order of allNovelIds
    const sortedNovels = data?.sort((a: Novel, b: Novel) => {
      const aIndex = allNovelIds.indexOf(a.id);
      const bIndex = allNovelIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Apply pagination
    const paginatedNovels = sortedNovels?.slice(offset, offset + limit);

    return {
      novels: paginatedNovels?.map(novel => ({
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
      total: totalCount || 0
    };
  } catch (error) {
    console.error('Error fetching novels:', error);
    return { novels: [], total: 0 };
  }
}

export async function getNovelsWithRecentUnlocks(
  limit: number = 12,
  offset: number = 0
): Promise<{ novels: Novel[]; total: number }> {
  try {
    // First get the latest chapter dates for each novel
    const { data: latestChapters } = await supabase
      .from('chapters')
      .select('novel_id, created_at')
      .order('created_at', { ascending: false });

    if (!latestChapters) {
      throw new Error('Failed to fetch latest chapters');
    }

    // Get unique novel IDs ordered by their latest chapter date
    const orderedNovelIds = [...new Set(latestChapters.map(ch => ch.novel_id))];
    
    if (orderedNovelIds.length === 0) {
      return { novels: [], total: 0 };
    }

    // Then fetch the full novel data in the correct order
    const { data: novels, error, count } = await supabase
      .from('novels')
      .select(`
        *,
        chapters (
          id,
          chapter_number,
          part_number,
          title,
          publish_at,
          coins,
          created_at
        )
      `, { count: 'exact' })
      .in('id', orderedNovelIds);

    if (error) throw error;

    // Sort the novels to match the order of orderedNovelIds
    const sortedNovels = novels?.sort((a, b) => {
      const aIndex = orderedNovelIds.indexOf(a.id);
      const bIndex = orderedNovelIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Apply pagination
    const paginatedNovels = sortedNovels?.slice(offset, offset + limit);

    // Process and return novels
    return {
      novels: (paginatedNovels || []).map(novel => ({
        ...novel,
        coverImageUrl: novel.cover_image_url,
        slug: novel.slug
      })),
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching novels with recent unlocks:', error);
    return { novels: [], total: 0 };
  }
}

export async function getNovelsWithAdvancedChapters(): Promise<Novel[]> {
  try {    
    interface DBNovel {
      id: string;
      title: string;
      slug: string;
      cover_image_url: string | null;
      chapters: {
        chapter_number: number;
        part_number?: number;
        publish_at: string;
      }[];
    }

    const { data: novels, error } = await supabase
      .rpc('get_novels_with_advanced_chapters');

    if (error) throw error;

    return (novels || []).map((novel: DBNovel) => {
      return {
        ...novel,
        coverImageUrl: novel.cover_image_url,
        chapters: novel.chapters || []
      };
    }) as Novel[];
  } catch (error) {
    console.error('Error fetching novels with advanced chapters:', error);
    return [];
  }
}

export async function getTopNovels(): Promise<Novel[]> {
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
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        )
      `)
      .order('views', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map(novel => ({
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
    }));
  } catch (error) {
    console.error('Error fetching top novels:', error);
    return [];
  }
}

export async function getCuratedNovels(limit: number = 10): Promise<Novel[]> {
  try {
    // Try to get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      // If user is not logged in, return popular novels instead
      return getTopNovels();
    }

    // Get user's bookmarks, ratings, and unlocked chapters to understand preferences
    const [bookmarksResult, ratingsResult, unlocksResult] = await Promise.all([
      supabase
        .from('bookmarks')
        .select('novel_id')
        .eq('profile_id', userId),
      supabase
        .from('novel_ratings')
        .select('novel_id, rating')
        .eq('profile_id', userId)
        .gte('rating', 4), // Only consider highly rated novels (4+ stars)
      supabase
        .from('chapter_unlocks')
        .select('novel_id')
        .eq('profile_id', userId)
    ]);

    // Extract novel IDs from user interactions
    const bookmarkedNovelIds = (bookmarksResult.data || []).map(b => b.novel_id);
    const highlyRatedNovelIds = (ratingsResult.data || []).map(r => r.novel_id);
    const unlockedNovelIds = (unlocksResult.data || []).map(u => u.novel_id);

    // Combine all novel IDs the user has interacted with
    const userInteractedNovelIds = [...new Set([
      ...bookmarkedNovelIds,
      ...highlyRatedNovelIds,
      ...unlockedNovelIds
    ])];

    if (userInteractedNovelIds.length === 0) {
      // If user hasn't interacted with any novels, return popular novels
      return getTopNovels();
    }

    // Get categories and tags from novels the user has interacted with
    const { data: userNovelMetadata } = await supabase
      .from('novels')
      .select(`
        id,
        categories:categories_on_novels (
          category_id
        ),
        tags:tags_on_novels (
          tag_id
        )
      `)
      .in('id', userInteractedNovelIds);

    // Extract category and tag IDs
    const userCategoryIds = new Set<string>();
    const userTagIds = new Set<string>();

    (userNovelMetadata || []).forEach(novel => {
      novel.categories?.forEach((cat: { category_id: string }) => 
        userCategoryIds.add(cat.category_id)
      );
      novel.tags?.forEach((tag: { tag_id: string }) => 
        userTagIds.add(tag.tag_id)
      );
    });

    // Find novels with similar categories or tags, excluding ones the user has already interacted with
    const { data: recommendedNovels } = await supabase
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
        categories:categories_on_novels (
          category:category_id (
            id,
            name,
            created_at,
            updated_at
          )
        ),
        tags:tags_on_novels (
          tag:tag_id (
            id,
            name,
            description
          )
        )
      `)
      .not('id', 'in', `(${userInteractedNovelIds.join(',')})`)
      .order('rating', { ascending: false })
      .limit(limit);

    // If no recommendations found based on user preferences, return top novels
    if (!recommendedNovels || recommendedNovels.length === 0) {
      return getTopNovels();
    }

    // Score novels based on category and tag overlap with user preferences
    const scoredNovels = recommendedNovels.map(novel => {
      let score = 0;
      
      // Score based on categories
      novel.categories?.forEach((cat: { category: { id: string } }) => {
        if (userCategoryIds.has(cat.category.id)) {
          score += 2; // Higher weight for categories
        }
      });
      
      // Score based on tags
      novel.tags?.forEach((tag: { tag: { id: string } }) => {
        if (userTagIds.has(tag.tag.id)) {
          score += 1;
        }
      });
      
      return { novel, score };
    });

    // Sort by score and return top recommendations
    return scoredNovels
      .sort((a, b) => b.score - a.score)
      .map(({ novel }) => ({
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
        categories: novel.categories?.map((item: { category: NovelCategory }) => item.category) || [],
        tags: novel.tags?.map((t: { tag: { id: string; name: string; description: string | null } }) => t.tag) || []
      }));
  } catch (error) {
    console.error('Error fetching curated novels:', error);
    return getTopNovels(); // Fallback to top novels on error
  }
}