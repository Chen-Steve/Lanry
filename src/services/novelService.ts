import { Novel, Chapter, ChapterUnlock, NovelCategory } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import supabaseAdmin from '@/lib/supabaseAdmin';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Utility to map DB novel rows to application Novel objects
function mapNovelRow<T extends { cover_image_url: string | null | undefined; tags?: unknown[] }>(row: T): Novel {
  return {
    ...row,
    // Rename snake_case DB field to camelCase expected by UI
    coverImageUrl: (row as any).cover_image_url ?? null,
    // Flatten tags structure if present
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    tags: ((row as any).tags || []).map((t: unknown) => (t as any).tag) || [],
  } as unknown as Novel;
}

interface GetNovelsOptions {
  limit?: number;
  offset?: number;
  categories?: {
    included: string[];
    excluded: string[];
  };
  /** Column to sort by, defaults to 'created_at' */
  sortBy?: string;
  /** Whether to sort ascending (default false / descending) */
  ascending?: boolean;
}

export async function getNovel(id: string, userId?: string, _useCache: boolean = true): Promise<Novel | null> {
  try {
    // Mark parameter as intentionally unused after removing caching logic
    void _useCache;

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

    // Note: Redis caching removed – returning fresh data each time
    return novel;
  } catch (error) {
    console.error('Error fetching novel:', error);
    return null;
  }
}

export async function toggleBookmark(
  novelId: string,
  userId: string,
  isCurrentlyBookmarked: boolean
): Promise<boolean> {
  try {
    // Supabase RPC expects a UUID. If we received a slug, resolve it first.
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i.test(
      novelId
    );

    let novelUUID = novelId;
    if (!isUUID) {
      const { data: novelRow, error: fetchError } = await supabase
        .from('novels')
        .select('id')
        .eq('slug', novelId)
        .single();

      if (fetchError || !novelRow?.id) {
        throw fetchError || new Error('Novel not found');
      }
      novelUUID = novelRow.id as string;
    }

    // Single atomic RPC ensures race-free toggle and counter update in DB
    const { data, error } = await supabase.rpc('toggle_bookmark', {
      p_novel_id: novelUUID,
      p_profile_id: userId,
      p_is_bookmarked: isCurrentlyBookmarked,
    });

    if (error) throw error;

    // Expecting RPC to return the new bookmark status, fallback to inversion
    return (
      (data as { new_is_bookmarked?: boolean } | null)?.new_is_bookmarked ??
      (data as boolean | null) ??
      !isCurrentlyBookmarked
    );
  } catch (error) {
    console.error('Error toggling bookmark via RPC:', error);
    throw error;
  }
}

export async function getNovels(options: GetNovelsOptions = {}): Promise<{ novels: Novel[]; total: number }> {
  try {
    const { limit = 12, offset = 0, categories, sortBy = 'created_at', ascending = false } = options;
    
    // Build the base query with minimal fields (exclude drafts)
    let query = supabase
      .from('novels')
      .select(
        `
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
      `,
        { count: 'exact' }
      )
      .neq('status', 'DRAFT')
      .order(sortBy, { ascending });

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

    const result = {
      novels: (data as any[]).map(mapNovelRow) as unknown as Novel[],
      total: count || 0,
    };

    // Redis caching removed – simply return query result
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
    // Prefer efficient RPC if available
    const [{ data: idRows, error: idsError }, { data: totalRows, error: totalError }] = await Promise.all([
      // get ordered page of IDs
      supabase.rpc('get_recently_updated_novel_ids', { p_limit: limit, p_offset: offset }),
      // get total
      supabase.rpc('get_recently_updated_total'),
    ]);

    if (!idsError && !totalError && idRows && totalRows !== null) {
      const pageIds: string[] = (idRows as { novel_id: string }[]).map((r) => r.novel_id);
      let total: number = 0;
      if (Array.isArray(totalRows)) {
        const first = (totalRows as Array<Record<string, unknown>>)[0] ?? {};
        const value = (first as Record<string, unknown>).get_recently_updated_total;
        total = typeof value === 'number' ? value : 0;
      } else if (typeof totalRows === 'number') {
        total = totalRows;
      }

      if (pageIds.length === 0 || total === 0) {
        return { novels: [], total: 0 };
      }

      const { data: pageNovels, error: pageError } = await supabase
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
        `)
        .in('id', pageIds)
        .neq('status', 'DRAFT');
      if (pageError) throw pageError;

      const sortedPageNovels = (pageNovels || []).sort((a, b) => {
        const aIndex = pageIds.indexOf(a.id);
        const bIndex = pageIds.indexOf(b.id);
        return aIndex - bIndex;
      });

      return {
        novels: sortedPageNovels.map(mapNovelRow),
        total,
      };
    }

    // Fallback: previous client-side ordering if RPC not available
    // 1) Get latest chapters ordered by creation date (most recent first)
    const { data: latestChapters } = await supabase
      .from('chapters')
      .select('novel_id, created_at')
      .order('created_at', { ascending: false });

    if (!latestChapters) {
      throw new Error('Failed to fetch latest chapters');
    }

    // 2) Unique novel IDs in recency order
    const orderedNovelIds = [...new Set(latestChapters.map((ch) => ch.novel_id))];
    if (orderedNovelIds.length === 0) {
      return { novels: [], total: 0 };
    }

    // 3) Filter out drafts first, preserving recency order
    const { data: validNovelIdRows, error: validIdsError } = await supabase
      .from('novels')
      .select('id')
      .in('id', orderedNovelIds)
      .neq('status', 'DRAFT');
    if (validIdsError) throw validIdsError;

    const validIdSet = new Set((validNovelIdRows || []).map((row) => row.id));
    const orderedNonDraftIds = orderedNovelIds.filter((id) => validIdSet.has(id));

    const total = orderedNonDraftIds.length;
    if (total === 0) {
      return { novels: [], total: 0 };
    }

    const pageIds = orderedNonDraftIds.slice(offset, offset + limit);
    if (pageIds.length === 0) {
      return { novels: [], total };
    }

    const { data: pageNovels, error: pageError } = await supabase
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
      `)
      .in('id', pageIds)
      .neq('status', 'DRAFT');
    if (pageError) throw pageError;

    const sortedPageNovels = (pageNovels || []).sort((a, b) => {
      const aIndex = pageIds.indexOf(a.id);
      const bIndex = pageIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    return {
      novels: sortedPageNovels.map(mapNovelRow),
      total,
    };
  } catch (error) {
    console.error('Error fetching novels with recent unlocks:', error);
    return { novels: [], total: 0 };
  }
}

export async function getNovelsWithAdvancedChapters(
  page: number = 1,
  limit: number = 8
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

    const novels = (result || []).map((novel: DBNovel) => ({
      ...mapNovelRow(novel as any),
      chapters: novel.chapters || []
    })) as Novel[];

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

export async function getTopNovels(limit: number = 5): Promise<Novel[]> {
  const { novels } = await getNovels({ limit, sortBy: 'views', ascending: false });
  return novels;
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
    // Calculate offset for pagination
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
        ...mapNovelRow(novel),
        slug: novel.slug,
        chapters: novel.chapters || [],
      })),
      total: count || 0,
    } as { novels: Novel[]; total: number };

    return response;
  } catch (error) {
    console.error('Error fetching completed novels:', error);
    return { novels: [], total: 0 };
  }
}

interface NovelCharacterFromDB {
  id: string;
  name: string;
  role: string;
  image_url: string;
  description: string | null;
  order_index: number;
}