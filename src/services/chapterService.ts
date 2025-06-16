import supabase from '@/lib/supabaseClient';
import { Chapter, Novel } from '@/types/database';
import { redis, CACHE_KEYS, CACHE_TTL, cacheHelpers } from '@/lib/redis';

type ChapterWithNovel = Chapter & {
  novel: Novel;
  isLocked?: boolean;
  hasTranslatorAccess?: boolean;
};

// Helper function to check if a chapter is published.
// Instead of making a separate RPC call for every chapter, we simply
// compare the provided publish date with the *current* time on the
// client. This removes hundreds of network round-trips per page while
// remaining accurate enough for typical use-cases (Supabase timestamps
// are stored in UTC, and `Date` parses ISO strings as UTC).
export function isChapterPublishedSync(publishAt: string | null): boolean {
  // No publish date means the chapter is immediately visible.
  if (!publishAt) return true;

  return new Date(publishAt).getTime() <= Date.now();
}

// Backwards-compat: keep the original async signature so existing code that
// does `await isChapterPublished(...)` continues to compile without edits.
// It now resolves *immediately* without hitting the network.
export async function isChapterPublished(publishAt: string | null): Promise<boolean> {
  return isChapterPublishedSync(publishAt);
}

export async function getChapter(novelId: string, chapterNumber: number, partNumber?: number | null): Promise<ChapterWithNovel | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // First resolve the novel to obtain its numeric id (needed for the canonical cache key)
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return null;

    // -------------------------------------------------
    // Redis caching layer (public chapters only)
    // -------------------------------------------------
    const chapterCacheKey = `${CACHE_KEYS.CHAPTER(novel.id, chapterNumber)}:${partNumber ?? 'null'}`;

    // Attempt to fetch cached base chapter
    const { data: cachedBaseChapter, metadata: cacheMeta } = await cacheHelpers.getWithMetadata<ChapterWithNovel>(chapterCacheKey);

    let chapterBase: ChapterWithNovel | null = null;

    if (cachedBaseChapter && !cacheHelpers.shouldRevalidate(cacheMeta)) {
      // Update visit metadata with 60-second write-throttle
      if (cacheMeta && Date.now() - cacheMeta.lastVisited > 60_000) {
        const newMeta = { ...cacheMeta, lastVisited: Date.now(), visitCount: cacheMeta.visitCount + 1 };
        redis.set(`${chapterCacheKey}:meta`, newMeta, { ex: CACHE_TTL.CHAPTER }).catch(console.error);
      }

      chapterBase = cachedBaseChapter;
    }

    // If no suitable cache, query Supabase
    if (!chapterBase) {
      // Get the chapter
      let query = supabase
        .from('chapters')
        .select(`
          *,
          novel:novels(
            id,
            title,
            author,
            author_profile_id
          )
        `)
        .eq('novel_id', novel.id)
        .eq('chapter_number', chapterNumber)
        .gte('chapter_number', 0); // Filter out negative chapter numbers (drafts)

      // Handle part number filter differently for null values
      if (partNumber === null || partNumber === undefined) {
        query = query.is('part_number', null);
      } else {
        query = query.eq('part_number', partNumber);
      }

      const { data: chapter, error } = await query.single();

      if (error || !chapter) return null;

      chapterBase = chapter;

      // Determine if chapter is safe to cache (published & free)
      const isPublished = isChapterPublishedSync(chapter.publish_at ?? null);
      const isFree = !chapter.coins || chapter.coins === 0;

      if (isPublished && isFree) {
        cacheHelpers.setWithMetadata(chapterCacheKey, chapterBase, CACHE_TTL.CHAPTER).catch(console.error);
      }
    }

    // ------------------------------------------------------------------
    // From here on we have the base chapter (from cache or DB). Apply
    // user-specific access checks without touching Redis again.
    // ------------------------------------------------------------------

    if (!chapterBase) return null; // Safety check for TypeScript

    const chapter: ChapterWithNovel = chapterBase;

    // Get user's profile to check role
    let hasTranslatorAccess = false;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Check if user is the author or a translator with matching author_profile_id
      const isAuthor = novel.author_profile_id === user.id;
      const isTranslator = profile?.role === 'TRANSLATOR' && novel.author_profile_id === user.id;
      hasTranslatorAccess = isAuthor || isTranslator;
    }

    // Add translator access information to the chapter data
    const chapterWithAccess = {
      ...chapter,
      hasTranslatorAccess
    };

    // If user has translator access, they can access all chapters
    if (hasTranslatorAccess) {
      return chapterWithAccess;
    }

    // First check if user has unlocked the chapter
    if (user) {
      let query = supabase
        .from('chapter_unlocks')
        .select('*')
        .eq('novel_id', novel.id)
        .eq('chapter_number', chapterNumber)
        .eq('profile_id', user.id);

      // Handle part_number separately based on whether it's null
      if (partNumber === null) {
        query = query.is('part_number', null);
      } else {
        query = query.eq('part_number', partNumber);
      }

      const { data: unlock } = await query.maybeSingle();

      // If chapter is unlocked, allow access regardless of publish status
      if (unlock) {
        return chapterWithAccess;
      }
    }

    // Check if chapter is published or free
    const isPublished = await isChapterPublished(chapter.publish_at ?? null);
    const isFree = !chapter.coins || chapter.coins === 0;
    
    // Chapter is accessible if:
    // 1. It's published (server time has passed publish date) OR
    // 2. It has no coins (free chapter) OR
    // 3. It has no publish date (immediately available)
    if (isPublished || isFree || !chapter.publish_at) {
      return chapterWithAccess;
    }

    // If not unlocked and not accessible, chapter is locked
    return { ...chapter, isLocked: true, hasTranslatorAccess: false };
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }
}

export async function getChapterNavigation(novelId: string, currentChapterNumber: number, currentPartNumber?: number | null) {
  try {
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id, translator_id, is_author_name_custom')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return { prevChapter: null, nextChapter: null, availableChapters: [], volumes: [] };

    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is author, translator, or created the novel as a translator
    const isAuthor = user && novel.author_profile_id === user.id;
    const isTranslator = user && novel.translator_id === user.id;
    const isTranslatorCreated = user && novel.author_profile_id === user.id && novel.is_author_name_custom === true;
    const hasFullAccess = isAuthor || isTranslator || isTranslatorCreated;

    // Get all chapters and volumes
    const [{ data: chapters }, { data: volumes }] = await Promise.all([
      supabase
        .from('chapters')
        .select('id, chapter_number, part_number, title, publish_at, coins, volume_id')
        .eq('novel_id', novel.id)
        .gte('chapter_number', 0) // Filter out negative chapter numbers (drafts)
        .order('chapter_number'),
      supabase
        .from('volumes')
        .select('id, title, volume_number')
        .eq('novel_id', novel.id)
        .order('volume_number')
    ]);

    if (!chapters || chapters.length === 0) {
      return { prevChapter: null, nextChapter: null, availableChapters: [], volumes: volumes || [] };
    }

    // Sort chapters by chapter_number and then part_number
    const sortedChapters = [...chapters].sort((a, b) => {
      // First compare chapter numbers
      if (a.chapter_number !== b.chapter_number) {
        return a.chapter_number - b.chapter_number;
      }
      // If chapter numbers are equal, sort by part number
      const partA = a.part_number ?? 0;
      const partB = b.part_number ?? 0;
      return partA - partB;
    });

    // If user is authenticated, get their unlocks with part numbers
    let unlockedChapters: { chapter_number: number; part_number: number | null; }[] = [];
    if (user) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number, part_number')
        .eq('novel_id', novel.id)
        .eq('profile_id', user.id);
      
      unlockedChapters = unlocks || [];
    }

    // Helper function to check if a chapter is unlocked
    const isChapterUnlocked = (chapter: { chapter_number: number; part_number: number | null }) => {
      return unlockedChapters.some(unlock => 
        unlock.chapter_number === chapter.chapter_number && 
        unlock.part_number === chapter.part_number // Exact match required for both chapter number and part number
      );
    };

    // Get current date in UTC for filtering
    const nowUTC = new Date().toISOString();
    const nowUTCTime = new Date(nowUTC).getTime();

    // Mark chapters as accessible based on publish status, unlocks, and user role
    const accessibleChapters = sortedChapters.map(chapter => {
      if (hasFullAccess) return { ...chapter, isAccessible: true };

      const isUnlocked = isChapterUnlocked(chapter);
      const isFree = !chapter.coins || chapter.coins === 0;
      const publishDate = chapter.publish_at;
      
      // A chapter is accessible if:
      // 1. It's free OR
      // 2. User has unlocked it OR
      // 3. The publish time has passed in the user's timezone
      const isAccessible = isFree || 
                          isUnlocked || 
                          (!publishDate || new Date(publishDate).getTime() <= nowUTCTime);

      return {
        ...chapter,
        isAccessible
      };
    });

    // Find the current chapter index considering both chapter number and part number
    const currentIndex = accessibleChapters.findIndex(ch => 
      ch.chapter_number === currentChapterNumber && 
      ch.part_number === currentPartNumber
    );
    
    return {
      prevChapter: currentIndex > 0 ? accessibleChapters[currentIndex - 1] : null,
      nextChapter: currentIndex < accessibleChapters.length - 1 ? accessibleChapters[currentIndex + 1] : null,
      availableChapters: accessibleChapters.map(ch => ({
        chapter_number: ch.chapter_number,
        part_number: ch.part_number,
        volume_id: ch.volume_id,
        isAccessible: ch.isAccessible
      })),
      volumes: volumes || []
    };
  } catch (error) {
    console.error('Error fetching chapter navigation:', error);
    return { prevChapter: null, nextChapter: null, availableChapters: [], volumes: [] };
  }
}

export async function getTotalChapters(novelId: string): Promise<number> {
  try {
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id, translator_id, is_author_name_custom')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return 0;

    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is author, translator, or created the novel as a translator
    const isAuthor = user && novel.author_profile_id === user.id;
    const isTranslator = user && novel.translator_id === user.id;
    const isTranslatorCreated = user && novel.author_profile_id === user.id && novel.is_author_name_custom === true;
    const hasFullAccess = isAuthor || isTranslator || isTranslatorCreated;

    // Get all chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('chapter_number, part_number, publish_at, coins')
      .eq('novel_id', novel.id)
      .gte('chapter_number', 0); // Filter out negative chapter numbers (drafts)

    if (!chapters) return 0;

    // If user has full access, return total count
    if (hasFullAccess) {
      return chapters.length;
    }

    // If user is authenticated, get their unlocks with part numbers
    let unlockedChapters: { chapter_number: number; part_number: number | null; }[] = [];
    if (user) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number, part_number')
        .eq('novel_id', novel.id)
        .eq('profile_id', user.id);
      
      unlockedChapters = unlocks || [];
    }

    // Helper function to check if a chapter is unlocked
    const isChapterUnlocked = (chapter: { chapter_number: number; part_number: number | null }) => {
      return unlockedChapters.some(unlock => 
        unlock.chapter_number === chapter.chapter_number && 
        unlock.part_number === chapter.part_number // Exact match required for both chapter number and part number
      );
    };

    // Count chapters that are either published or unlocked
    const accessibleChapters = await Promise.all(chapters.map(async chapter => {
      const isPublished = !chapter.publish_at || await isChapterPublished(chapter.publish_at ?? null);
      const isUnlocked = isChapterUnlocked(chapter);
      return isPublished || isUnlocked;
    }));

    return accessibleChapters.filter(Boolean).length;
  } catch (error) {
    console.error('Error getting total chapters:', error);
    return 0;
  }
}

export async function getTotalAllChapters(novelId: string): Promise<number> {
  try {
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return 0;

    // Get total count of all chapters without filtering
    const { count } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novel.id)
      .gte('chapter_number', 0); // Filter out negative chapter numbers (drafts)

    return count || 0;
  } catch (error) {
    console.error('Error getting total chapters:', error);
    return 0;
  }
}

export interface ChapterListParams {
  novelId: string;
  page?: number;
  limit?: number;
  userId?: string | null;
  showAdvanced?: boolean;
  volumeId?: string | null;
  includeAccess?: boolean;
}

export interface ChapterListItem {
  id: string;
  chapter_number: number;
  part_number?: number | null;
  title: string;
  publish_at?: string | null;
  coins?: number;
  age_rating?: string;
  volume_id?: string | null;
  hasTranslatorAccess?: boolean;
  isUnlocked?: boolean;
}

export interface ChapterCounts {
  regularCount: number;
  advancedCount: number;
  total: number;
}

export async function getChaptersForList({
  novelId,
  page = 1,
  limit = 50,
  userId,
  showAdvanced = false,
  volumeId,
  includeAccess = false
}: ChapterListParams): Promise<{ 
  chapters: ChapterListItem[]; 
  counts: ChapterCounts;
  total: number;
  currentPage: number;
  totalPages: number;
}> {
  try {
    // Get novel info and check translator access in parallel
    const [novelResult, userResult] = await Promise.all([
      supabase
        .from('novels')
        .select('id, author_profile_id')
        .or(`id.eq.${novelId},slug.eq.${novelId}`)
        .single(),
      includeAccess && userId ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } })
    ]);

    if (novelResult.error || !novelResult.data) {
      throw new Error('Novel not found');
    }

    const novel = novelResult.data;

    // Check translator access only if needed
    let hasTranslatorAccess = false;
    if (includeAccess && userResult.data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userResult.data.user.id)
        .single();

      const isAuthor = novel.author_profile_id === userResult.data.user.id;
      const isTranslator = profile?.role === 'TRANSLATOR' && novel.author_profile_id === userResult.data.user.id;
      hasTranslatorAccess = isAuthor || isTranslator;
    }

    // Get user's unlocks if needed
    let unlockedChapters: { chapter_number: number; part_number: number | null; }[] = [];
    if (includeAccess && userId) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number, part_number')
        .eq('novel_id', novel.id)
        .eq('profile_id', userId);

      unlockedChapters = unlocks || [];
    }

    // Helper function to check if a chapter is unlocked
    const isChapterUnlocked = (chapter: { chapter_number: number; part_number: number | null }) => {
      return unlockedChapters.some(unlock => 
        unlock.chapter_number === chapter.chapter_number && 
        unlock.part_number === chapter.part_number
      );
    };

    // Build the main query
    let query = supabase
      .from('chapters')
      .select('id, chapter_number, part_number, title, publish_at, coins, age_rating, volume_id', { count: 'exact' })
      .eq('novel_id', novel.id)
      .gte('chapter_number', 0) // Filter out negative chapter numbers (drafts)
      .order('chapter_number', { ascending: true });

    // Apply volume filtering
    if (volumeId) {
      query = query.eq('volume_id', volumeId);
    }

    // Get all chapters for filtering
    const { data: allChapters, error: chaptersError } = await query;
    
    if (chaptersError || !allChapters) {
      throw chaptersError || new Error('Failed to fetch chapters');
    }

    // Sort chapters by chapter_number and then part_number
    const sortedChapters = [...allChapters].sort((a, b) => {
      // First compare chapter numbers
      if (a.chapter_number !== b.chapter_number) {
        return a.chapter_number - b.chapter_number;
      }
      // If chapter numbers are equal, sort by part number
      const partA = a.part_number ?? 0;
      const partB = b.part_number ?? 0;
      return partA - partB;
    });

    // Filter chapters based on access and advanced status
    const now = new Date().toISOString();
    const filteredChapters = sortedChapters.filter(ch => {
      const isUnlocked = includeAccess && isChapterUnlocked(ch);
      const isFree = !ch.coins || ch.coins === 0;
      const isPublished = !ch.publish_at || ch.publish_at <= now;
      const isAdvancedChapter = ch.publish_at && ch.publish_at > now && (ch.coins || 0) > 0;

      if (hasTranslatorAccess) return true;
      if (showAdvanced) {
        return isAdvancedChapter && !isUnlocked;
      } else {
        return isUnlocked || isFree || isPublished;
      }
    });

    // Calculate counts
    const counts: ChapterCounts = {
      regularCount: allChapters.filter(ch => {
        const isUnlocked = includeAccess && isChapterUnlocked(ch);
        const isFree = !ch.coins || ch.coins === 0;
        const isPublished = !ch.publish_at || ch.publish_at <= now;
        return isUnlocked || isFree || isPublished;
      }).length,
      advancedCount: allChapters.filter(ch => {
        const isUnlocked = includeAccess && isChapterUnlocked(ch);
        const isAdvancedChapter = ch.publish_at && ch.publish_at > now && (ch.coins || 0) > 0;
        return isAdvancedChapter && !isUnlocked;
      }).length,
      total: allChapters.length
    };

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedChapters = filteredChapters.slice(start, end);

    // Add access information if needed
    const processedChapters = paginatedChapters.map(chapter => ({
      ...chapter,
      hasTranslatorAccess: includeAccess ? hasTranslatorAccess : undefined,
      isUnlocked: includeAccess ? isChapterUnlocked(chapter) : undefined
    }));

    return {
      chapters: processedChapters,
      counts,
      total: filteredChapters.length,
      currentPage: page,
      totalPages: Math.ceil(filteredChapters.length / limit)
    };
  } catch (error) {
    console.error('Error getting chapters:', error);
    throw error;
  }
}

export async function getTotalChaptersForNovels(novelIds: string[]): Promise<Record<string, number>> {
  // Early return if the caller passes an empty array
  if (novelIds.length === 0) {
    return {};
  }

  try {
    // PostgREST grouping (`group=column`) isn't exposed in supabase-js typings yet, so
    // we'll fetch only the novel_id column for the requested novels and aggregate in JS.
    // This is still **one** network request instead of N, and the payload is minimal.

    const { data, error } = await supabase
      .from('chapters')
      .select('novel_id')
      .gte('chapter_number', 0) // ignore drafts (negative chapter numbers)
      .in('novel_id', novelIds);

    if (error) throw error;

    const counts: Record<string, number> = {};
    // Initialize all counts to 0 so that missing novels are represented.
    novelIds.forEach((id) => (counts[id] = 0));

    (data as { novel_id: string }[]).forEach((row) => {
      counts[row.novel_id] = (counts[row.novel_id] || 0) + 1;
    });

    return counts;
  } catch (err) {
    console.error('Error fetching chapter counts in bulk:', err);
    return {};
  }
} 