import { Novel, Chapter, ChapterUnlock, NovelCategory } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';
import { cache } from 'react';
import { redis, CACHE_KEYS, CACHE_TTL, shouldBypassCache, cacheHelpers } from '@/lib/redis';
import supabaseAdmin from '@/lib/supabaseAdmin';

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

export async function getNovel(id: string, userId?: string, useCache: boolean = true): Promise<Novel | null> {
  try {
    const cacheKey = CACHE_KEYS.NOVEL(id);
    
    if (useCache) {
      // Try to get from cache with metadata
      const { data: cachedNovel, metadata } = await cacheHelpers.getWithMetadata<Novel>(cacheKey);
      
      // If we have cached data, update visit metadata **without an extra read**.
      if (cachedNovel) {
        // Lightweight metadata write-back in the background (max once per minute)
        if (metadata) {
          const now = Date.now();
          const timeSinceLast = now - metadata.lastVisited;
          // Only persist if at least 60s have passed to avoid excessive writes
          if (timeSinceLast > 60_000) {
            const newMeta = { ...metadata, lastVisited: now, visitCount: metadata.visitCount + 1 };
            redis.set(`${cacheKey}:meta`, newMeta, { ex: CACHE_TTL.NOVEL }).catch(console.error);
          }
        }

        // If cache is still fresh and no bypass conditions, return cached data
        if (!shouldBypassCache.isAuthorRequest(userId, cachedNovel.author_profile_id) && 
            !shouldBypassCache.isDraftContent(cachedNovel.status) &&
            !cacheHelpers.shouldRevalidate(metadata)) {
          console.log('Cache hit for novel:', id);
          return cachedNovel;
        }
      }
    }

    console.log('Cache miss or revalidating novel:', id);

    // Fetch fresh data
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

    // Determine if the signed-in user is the author **or** translator
    const hasTranslatorAccess = !!userId && (
      // Original author
      data.author_profile_id === userId ||
      // Dedicated translator column matches
      data.translator_id === userId ||
      // Novel created by a translator under custom author name
      (data.author_profile_id === userId && data.is_author_name_custom === true)
    );

    // If the novel is a draft and the user is not the author, deny access
    if (data.status === 'DRAFT' && !hasTranslatorAccess) {
      return null;
    }

    // Process chapters to include unlock status and translator access
    const chapters = (data.chapters || [])
      .filter((chapter: Chapter) => chapter.chapter_number >= 0) // Filter out negative chapter numbers (drafts)
      .map((chapter: Chapter) => ({
        ...chapter,
        isUnlocked: userId ? 
          data.chapter_unlocks?.some((unlock: ChapterUnlock) => 
            unlock.chapter_number === chapter.chapter_number && 
            unlock.profile_id === userId
          ) : false,
        hasTranslatorAccess
      })).sort((a: Chapter, b: Chapter) => {
        // First sort by chapter number
        if (a.chapter_number !== b.chapter_number) {
          return a.chapter_number - b.chapter_number;
        }
        // If chapter numbers are equal, sort by part number
        const partA = a.part_number ?? 0;
        const partB = b.part_number ?? 0;
        return partA - partB;
      });

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

    const novel = {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
      tags: (data.tags || []).map((t: unknown) => (t as any).tag) || [],
      characters,
      ageRating: data.age_rating
    };

    // Cache the new data in the background if caching is enabled
    if (useCache) {
      cacheHelpers.setWithMetadata(cacheKey, novel, CACHE_TTL.NOVEL).catch(console.error);
    }

    return novel;
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
    
    // Generate cache key based on options
    const cacheKey = `${CACHE_KEYS.NOVEL_LIST}:${limit}:${offset}:${categories?.included?.join(',') || ''}:${categories?.excluded?.join(',') || ''}`;
    
    // Try to get from cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return cachedResult as { novels: Novel[]; total: number };
    }
    
    // Build the base query with minimal fields
    let query = supabase
      .from('novels')
      .select(`
        id,
        title,
        slug,
        author,
        description,
        status,
        age_rating,
        created_at,
        updated_at,
        cover_image_url,
        bookmark_count,
        rating,
        rating_count,
        views,
        author_profile_id,
        tags:tags_on_novels (
          tag:tag_id (
            id,
            name,
            description
          )
        )
      `, { count: 'exact' })
      .neq('status', 'DRAFT')
      .order('created_at', { ascending: false });

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

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const result = {
      novels: (data as any[]).map(novel => ({
        ...novel,
        coverImageUrl: novel.cover_image_url
      })) as unknown as Novel[],
      total: count || 0
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Cache the result
    await redis.set(cacheKey, result, {
      ex: CACHE_TTL.NOVEL_LIST
    });

    return result;
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

    // Then fetch the full novel data in the correct order, excluding drafts
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
      .in('id', orderedNovelIds)
      .neq('status', 'DRAFT');

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

export async function getNovelsWithAdvancedChapters(
  page: number = 1,
  limit: number = 10
): Promise<{ novels: Novel[]; total: number }> {
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

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // First get the count
    const { data: countResult, count: totalCount, error: countError } = await supabase
      .from('chapters')
      .select('novel_id', { count: 'exact', head: true })
      .gt('publish_at', new Date().toISOString())
      .gt('coins', 0)
      .not('coins', 'is', null);

    console.log('Count Query Result:', { countResult, totalCount, countError });

    if (countError) throw countError;

    // Get the novels with their advanced chapters
    const { data: result, error: novelsError } = await supabase
      .rpc('get_novels_with_advanced_chapters', {
        p_limit: limit,
        p_offset: offset
      });

    console.log('Novels Query Result:', { 
      result, 
      novelsError,
      offset,
      limit
    });

    if (novelsError) throw novelsError;

    const novels = (result || []).map((novel: DBNovel) => {
      return {
        ...novel,
        coverImageUrl: novel.cover_image_url,
        chapters: novel.chapters || []
      };
    }) as Novel[];

    const response = {
      novels,
      total: totalCount || 0
    };

    console.log('Final Response:', response);

    return response;
  } catch (error) {
    console.error('Error fetching novels with advanced chapters:', error);
    return { novels: [], total: 0 };
  }
}

export async function getTopNovels(): Promise<Novel[]> {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        id,
        title,
        slug,
        cover_image_url,
        author,
        description,
        status,
        age_rating,
        created_at,
        updated_at,
        bookmark_count,
        rating,
        rating_count,
        views,
        author_profile_id,
        tags:tags_on_novels (
          tag:tag_id (
            id,
            name,
            description
          )
        )
      `)
      .neq('status', 'DRAFT')
      .order('views', { ascending: false })
      .limit(5);

    if (error) throw error;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data as any[]).map(novel => ({
      ...novel,
      coverImageUrl: novel.cover_image_url,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
      tags: (novel.tags || []).map((t: unknown) => (t as any).tag) || []
    })) as unknown as Novel[];
    /* eslint-enable @typescript-eslint/no-explicit-any */
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
      .neq('status', 'DRAFT')
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
        tags: (novel.tags || []).map((t: unknown) => (t as any).tag) || []
      }));
  } catch (error) {
    console.error('Error fetching curated novels:', error);
    return getTopNovels(); // Fallback to top novels on error
  }
}

export async function getCompletedNovels(
  page: number = 1,
  limit: number = 35
): Promise<{ novels: Novel[]; total: number }> {
  try {
    // Build cache key for this page/limit combination
    const cacheKey = `${CACHE_KEYS.COMPLETED_NOVELS}:${page}:${limit}`;

    // 1. Try Redis first (stale-while-revalidate style)
    const {
      data: cached,
      metadata,
    } = await cacheHelpers.getWithMetadata<{ novels: Novel[]; total: number }>(cacheKey);

    if (cached && !cacheHelpers.shouldRevalidate(metadata)) {
      // Cache hit & still fresh
      return cached;
    }

    // 2. Cache miss or stale – fetch from Supabase
    // Calculate offset
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('novels')
      .select(
        `
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
      `,
        { count: 'exact' }
      )
      .eq('status', 'COMPLETED')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const response = {
      novels: (data || []).map((novel) => ({
        ...novel,
        coverImageUrl: novel.cover_image_url,
        slug: novel.slug,
        chapters: novel.chapters || [],
      })),
      total: count || 0,
    } as { novels: Novel[]; total: number };

    // 3. Store in Redis (fire-and-forget)
    cacheHelpers
      .setWithMetadata(cacheKey, response, CACHE_TTL.COMPLETED_NOVELS)
      .catch(console.error);

    return response;
  } catch (error) {
    console.error('Error fetching completed novels:', error);
    return { novels: [], total: 0 };
  }
}