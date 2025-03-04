import supabase from '@/lib/supabaseClient';
import { Chapter, Novel } from '@/types/database';

type ChapterWithNovel = Chapter & {
  novel: Novel;
  isLocked?: boolean;
  hasTranslatorAccess?: boolean;
};

// Helper function to check if a chapter is published based on user's local timezone
function isChapterPublished(publishAt: string | null): boolean {
  if (!publishAt) return true; // No publish date means it's published immediately
  
  // Convert both dates to UTC for comparison
  const publishDate = new Date(publishAt);
  const now = new Date();
  
  // Convert both to UTC timestamps for accurate comparison
  const publishTimestamp = Date.UTC(
    publishDate.getUTCFullYear(),
    publishDate.getUTCMonth(),
    publishDate.getUTCDate(),
    publishDate.getUTCHours(),
    publishDate.getUTCMinutes(),
    publishDate.getUTCSeconds()
  );
  
  const nowTimestamp = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );

  return publishTimestamp <= nowTimestamp;
}

export async function getChapter(novelId: string, chapterNumber: number, partNumber?: number | null): Promise<ChapterWithNovel | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // First get the novel to check if user is author
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return null;

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
      .eq('chapter_number', chapterNumber);

    // Handle part number filter differently for null values
    if (partNumber === null || partNumber === undefined) {
      query = query.is('part_number', null);
    } else {
      query = query.eq('part_number', partNumber);
    }

    const { data: chapter, error } = await query.single();

    if (error || !chapter) return null;

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
    const isPublished = isChapterPublished(chapter.publish_at);
    const isFree = !chapter.coins || chapter.coins === 0;
    
    // Chapter is accessible if:
    // 1. It's published (publish date has passed) OR
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
        .order('chapter_number')
        .order('part_number', { nullsFirst: true }),
      supabase
        .from('volumes')
        .select('id, title, volume_number')
        .eq('novel_id', novel.id)
        .order('volume_number')
    ]);

    if (!chapters || chapters.length === 0) {
      return { prevChapter: null, nextChapter: null, availableChapters: [], volumes: volumes || [] };
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

    // Get current date in UTC for filtering
    const nowUTC = new Date().toISOString();
    const nowUTCTime = new Date(nowUTC).getTime();

    // Mark chapters as accessible based on publish status, unlocks, and user role
    const accessibleChapters = chapters.map(chapter => {
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
      .order('chapter_number', { ascending: false });

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
    const accessibleChapters = chapters.filter(chapter => {
      const isPublished = !chapter.publish_at || chapter.publish_at <= new Date().toISOString();
      const isUnlocked = isChapterUnlocked(chapter);
      return isPublished || isUnlocked;
    });

    return accessibleChapters.length;
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
      .eq('novel_id', novel.id);

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

export type ChapterListItem = Pick<Chapter, 
  'id' | 
  'chapter_number' | 
  'part_number' | 
  'title' | 
  'publish_at' | 
  'coins' | 
  'age_rating'
> & {
  volume_id?: string;
  hasTranslatorAccess?: boolean;
  isUnlocked?: boolean;
};

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
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      throw new Error('Novel not found');
    }

    // Check if user has translator access
    const { data: { user } } = await supabase.auth.getUser();
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

    // Get all chapters
    let query = supabase
      .from('chapters')
      .select('id, chapter_number, part_number, title, publish_at, coins, age_rating, volume_id', { count: 'exact' })
      .eq('novel_id', novel.id);

    // Apply volume filtering first, before any other filters
    if (volumeId) {
      query = query.eq('volume_id', volumeId);
    }

    // Get user's unlocks if authenticated
    let unlockedChapters: { chapter_number: number; part_number: number | null; }[] = [];
    if (userId) {
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

    // If user is not a translator, filter based on advanced/regular and unlocks
    if (!hasTranslatorAccess) {
      if (!showAdvanced) {
        // Get all chapters first for time comparison
        const { data: regularChapters } = await supabase
          .from('chapters')
          .select('id, publish_at, coins, chapter_number, part_number')
          .eq('novel_id', novel.id);

        if (regularChapters) {
          const regularIds = regularChapters
            .filter(ch => {
              const isUnlocked = isChapterUnlocked(ch);
              const isFree = !ch.coins || ch.coins === 0;
              const isPublished = isChapterPublished(ch.publish_at);
              return isUnlocked || isFree || isPublished;
            })
            .map(ch => ch.id);

          if (regularIds.length > 0) {
            query = query.in('id', regularIds);
          } else {
            query = query.eq('id', '-1');
          }
        }
      }
    }

    // Handle advanced chapters filtering separately from user access
    if (showAdvanced) {
      // Get all chapters with coins that have future publish dates
      const { data: advancedChapters } = await supabase
        .from('chapters')
        .select('id, publish_at, chapter_number, part_number')
        .eq('novel_id', novel.id)
        .gt('coins', 0);

      if (advancedChapters) {
        const advancedIds = advancedChapters
          .filter(ch => {
            const isNotPublished = !isChapterPublished(ch.publish_at);
            const isNotUnlocked = !isChapterUnlocked(ch);
            return isNotPublished && isNotUnlocked;
          })
          .map(ch => ch.id);

        if (advancedIds.length > 0) {
          query = query.in('id', advancedIds);
        } else {
          // No advanced chapters found, return empty result
          query = query.eq('id', '-1');
        }
      }
    }

    // Calculate total pages and offset
    const offset = (page - 1) * limit;
    query = query.order('chapter_number').order('part_number', { nullsFirst: true }).range(offset, offset + limit - 1);

    const { data: chapters, count, error } = await query;

    if (error) {
      throw error;
    }

    // Get counts for regular and advanced chapters
    const { data: allChapters } = await supabase
      .from('chapters')
      .select('chapter_number, publish_at, coins, part_number')
      .eq('novel_id', novel.id);

    // Log some sample chapter data to understand the time comparisons
    if (allChapters && allChapters.length > 0) {
      const sampleChapter = allChapters[allChapters.length - 1]; // Get the latest chapter
      if (sampleChapter.publish_at) {
        console.log('Sample chapter publish time (UTC):', sampleChapter.publish_at);
        console.log('Current time (UTC):', new Date().toISOString());
        console.log('Is this chapter advanced?', !isChapterPublished(sampleChapter.publish_at));
      }
    }

    const counts = {
      regularCount: allChapters?.filter(ch => {
        const isUnlocked = isChapterUnlocked(ch);
        const isFree = !ch.coins || ch.coins === 0;
        const isPublished = isChapterPublished(ch.publish_at);
        return isUnlocked || isFree || isPublished;
      }).length || 0,
      advancedCount: allChapters?.filter(ch => {
        return !isChapterPublished(ch.publish_at) && ch.coins > 0;
      }).length || 0,
      total: allChapters?.length || 0
    };

    // Add access information to chapters if requested
    const processedChapters = chapters?.map(chapter => ({
      ...chapter,
      hasTranslatorAccess: includeAccess ? hasTranslatorAccess : undefined,
      isUnlocked: includeAccess ? isChapterUnlocked(chapter) : undefined,
      volume_id: chapter.volume_id
    })) as ChapterListItem[] || [];

    return {
      chapters: processedChapters,
      counts,
      total: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error getting chapters:', error);
    throw error;
  }
}

export interface ChapterCounts {
  regularCount: number;
  advancedCount: number;
  total: number;
} 