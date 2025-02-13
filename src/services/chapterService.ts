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

    // Filter chapters that are either published, unlocked, or if user is the author
    const accessibleChapters = chapters.filter(chapter => {
      if (hasFullAccess) return true; // Author or translator can access all chapters
      const isPublished = !chapter.publish_at || chapter.publish_at <= new Date().toISOString();
      const isUnlocked = userUnlocks.includes(chapter.chapter_number);
      return isPublished || isUnlocked;
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
        volume_id: ch.volume_id
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
};

export async function getChaptersForList({
  novelId,
  page = 1,
  limit = 50,
  userId,
  showAdvanced = false,
  volumeId
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
    const hasFullAccess = isAuthor || isTranslator || isTranslatorCreated;

    // Get all chapters
    let query = supabase
      .from('chapters')
      .select('id, chapter_number, part_number, title, publish_at, coins, age_rating, volume_id', { count: 'exact' })
      .eq('novel_id', novel.id);

    // Get current date for filtering
    const now = new Date().toISOString();

    // If user is not author/translator, filter based on advanced/regular and unlocks
    if (!hasFullAccess) {
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
          .gt('publish_at', now)
          .gt('coins', 0);
        
        if (unlockedChapterNumbers.length > 0) {
          query = query.not('chapter_number', 'in', `(${unlockedChapterNumbers.join(',')})`);
        }
      } else {
        // Regular chapters: either
        // 1. Free (no coins)
        // 2. Published based on UTC time
        // 3. Unlocked by the user
        let regularCondition = `coins.is.null,coins.eq.0,publish_at.lte.${now}`;
        
        if (unlockedChapterNumbers.length > 0) {
          regularCondition += `,chapter_number.in.(${unlockedChapterNumbers.join(',')})`;
        }
        
        query = query.or(regularCondition);
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
        return !ch.coins || ch.coins === 0 || // Free chapters
               (!ch.publish_at || ch.publish_at <= now) || // Published chapters (UTC comparison)
               isUnlocked; // Unlocked chapters
      }).length || 0,
      advancedCount: allChapters?.filter(ch => {
        const isUnlocked = unlockedChapterNumbers.includes(ch.chapter_number);
        return ch.publish_at && 
               ch.publish_at > now && // Future publish date (UTC comparison)
               ch.coins > 0 &&
               !isUnlocked; // Not unlocked
      }).length || 0,
      total: allChapters?.length || 0
    };

    return {
      chapters: chapters || [],
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