import supabase from '@/lib/supabaseClient';
import { Chapter, Novel } from '@/types/database';

type ChapterWithNovel = Chapter & {
  novel: Novel;
  isLocked?: boolean;
};

export async function getChapter(novelId: string, chapterNumber: number, partNumber?: number | null): Promise<ChapterWithNovel | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // First get the novel to check if user is author
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, author_profile_id, translator_id, is_author_name_custom')
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
          author_profile_id,
          translator_id,
          is_author_name_custom
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

    // Check if user is the author, translator, or created the novel as a translator
    const isAuthor = user && novel.author_profile_id === user.id;
    const isTranslator = user && novel.translator_id === user.id;
    const isTranslatorCreated = user && novel.author_profile_id === user.id && novel.is_author_name_custom === true;

    // If user is author, translator, or created the novel as a translator, they can access all chapters
    if (isAuthor || isTranslator || isTranslatorCreated) {
      return chapter;
    }

    // Check if chapter is published or user has unlocked it
    const isPublished = !chapter.publish_at || chapter.publish_at <= new Date().toISOString();
    
    if (!isPublished && chapter.coins > 0) {
      // Check if user has unlocked this chapter
      if (!user) return { ...chapter, isLocked: true };

      const { data: unlock } = await supabase
        .from('chapter_unlocks')
        .select('*')
        .eq('novel_id', novel.id)
        .eq('chapter_number', chapterNumber)
        .eq('profile_id', user.id)
        .single();

      if (!unlock) return { ...chapter, isLocked: true };
    }

    return chapter;
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

    // If user is authenticated, get their unlocks
    let userUnlocks: number[] = [];
    if (user) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number')
        .eq('novel_id', novel.id)
        .eq('profile_id', user.id);
      
      userUnlocks = unlocks?.map(u => u.chapter_number) || [];
    }

    // Get current date in UTC for filtering
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Add 1 minute buffer
    const nowUTC = now.toISOString();

    // Mark chapters as accessible based on publish status, unlocks, and user role
    const accessibleChapters = chapters.map(chapter => {
      if (hasFullAccess) return { ...chapter, isAccessible: true };

      const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= now;
      const isUnlocked = userUnlocks.includes(chapter.chapter_number);
      const isFree = !chapter.coins || chapter.coins === 0;
      
      // A chapter is accessible if:
      // 1. It's free OR
      // 2. It's published (past publish date) OR
      // 3. User has unlocked it
      const isAccessible = isFree || isPublished || isUnlocked;

      return {
        ...chapter,
        isAccessible
      };
    });

    // Filter chapters for navigation based on accessibility
    const navigableChapters = accessibleChapters.filter(ch => ch.isAccessible);

    // Find the current chapter index considering both chapter number and part number
    const currentIndex = navigableChapters.findIndex(ch => 
      ch.chapter_number === currentChapterNumber && 
      ch.part_number === currentPartNumber
    );
    
    return {
      prevChapter: currentIndex > 0 ? navigableChapters[currentIndex - 1] : null,
      nextChapter: currentIndex < navigableChapters.length - 1 ? navigableChapters[currentIndex + 1] : null,
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
      .select('chapter_number, publish_at, coins')
      .eq('novel_id', novel.id)
      .order('chapter_number', { ascending: false });

    if (!chapters) return 0;

    // If user has full access, return total count
    if (hasFullAccess) {
      return chapters.length;
    }

    // If user is authenticated, get their unlocks
    let userUnlocks: number[] = [];
    if (user) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number')
        .eq('novel_id', novel.id)
        .eq('profile_id', user.id);
      
      userUnlocks = unlocks?.map(u => u.chapter_number) || [];
    }

    // Count chapters that are either published or unlocked
    const accessibleChapters = chapters.filter(chapter => {
      const isPublished = !chapter.publish_at || chapter.publish_at <= new Date().toISOString();
      const isUnlocked = userUnlocks.includes(chapter.chapter_number);
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
      .select('id, author_profile_id, translator_id, is_author_name_custom')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      throw new Error('Novel not found');
    }

    // Check if user is author, translator, or created the novel as a translator
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthor = user && novel.author_profile_id === user.id;
    const isTranslator = user && novel.translator_id === user.id;
    const isTranslatorCreated = user && novel.author_profile_id === user.id && novel.is_author_name_custom === true;
    const hasTranslatorAccess = isAuthor || isTranslator || isTranslatorCreated;

    // Get all chapters
    let query = supabase
      .from('chapters')
      .select('id, chapter_number, part_number, title, publish_at, coins, age_rating, volume_id', { count: 'exact' })
      .eq('novel_id', novel.id);

    // Get current date in UTC for filtering
    // Add a small buffer (1 minute) to prevent edge cases
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const nowUTC = now.toISOString();

    // If user is not author/translator, filter based on advanced/regular and unlocks
    if (!hasTranslatorAccess) {
      // First, get user's unlocks if authenticated
      let unlockedChapterNumbers: number[] = [];
      if (userId) {
        const { data: unlocks } = await supabase
          .from('chapter_unlocks')
          .select('chapter_number')
          .eq('novel_id', novel.id)
          .eq('profile_id', userId);

        unlockedChapterNumbers = unlocks?.map(u => u.chapter_number) || [];
      }

      if (showAdvanced) {
        // Advanced chapters: future publish date AND has coins AND not unlocked
        query = query
          .gt('publish_at', nowUTC)
          .gt('coins', 0);
        
        if (unlockedChapterNumbers.length > 0) {
          query = query.not('chapter_number', 'in', `(${unlockedChapterNumbers.join(',')})`);
        }
      } else {
        // Regular chapters: either
        // 1. Free (no coins) OR
        // 2. Published based on UTC time OR
        // 3. Unlocked by the user
        const conditions = [];
        
        // Free chapters
        conditions.push('coins.is.null');
        conditions.push('coins.eq.0');
        
        // Published chapters
        conditions.push(`publish_at.lte.${nowUTC}`);
        
        // Unlocked chapters
        if (unlockedChapterNumbers.length > 0) {
          conditions.push(`chapter_number.in.(${unlockedChapterNumbers.join(',')})`);
        }
        
        // Combine all conditions with OR
        query = query.or(conditions.join(','));
      }

      if (volumeId) {
        query = query.eq('volume_id', volumeId);
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
      .select('chapter_number, publish_at, coins')
      .eq('novel_id', novel.id);

    // Get user's unlocks if authenticated
    let unlockedChapterNumbers: number[] = [];
    if (userId) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number')
        .eq('novel_id', novel.id)
        .eq('profile_id', userId);

      unlockedChapterNumbers = unlocks?.map(u => u.chapter_number) || [];
    }

    const counts = {
      regularCount: allChapters?.filter(ch => {
        const isUnlocked = unlockedChapterNumbers.includes(ch.chapter_number);
        const publishDate = ch.publish_at ? new Date(ch.publish_at) : null;
        return !ch.coins || ch.coins === 0 || // Free chapters
               (publishDate && publishDate <= now) || // Published chapters (using the same UTC time as above)
               isUnlocked; // Unlocked chapters
      }).length || 0,
      advancedCount: allChapters?.filter(ch => {
        const isUnlocked = unlockedChapterNumbers.includes(ch.chapter_number);
        const publishDate = ch.publish_at ? new Date(ch.publish_at) : null;
        return publishDate && 
               publishDate > now && // Future publish date (using the same UTC time as above)
               ch.coins > 0 &&
               !isUnlocked; // Not unlocked
      }).length || 0,
      total: allChapters?.length || 0
    };

    // Add access information to chapters if requested
    const processedChapters = chapters?.map(chapter => ({
      ...chapter,
      hasTranslatorAccess: includeAccess ? hasTranslatorAccess : undefined,
      isUnlocked: includeAccess ? unlockedChapterNumbers.includes(chapter.chapter_number) : undefined,
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