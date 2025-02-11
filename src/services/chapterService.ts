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
    const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
    
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
      const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
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
      const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
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
    const now = new Date().toISOString();
    
    // Get total counts first with a separate count query
    let countQuery = supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);

    // Add conditional filters
    if (volumeId !== null && volumeId !== undefined) {
      countQuery = countQuery.eq('volume_id', volumeId);
    }
    
    if (showAdvanced) {
      countQuery = countQuery.gt('publish_at', now);
    } else {
      countQuery = countQuery.or(`publish_at.lte.${now},publish_at.is.null`);
    }

    const { count: totalCount } = await countQuery;

    // Calculate counts for both types in a single query
    const { data: countData } = await supabase
      .from('chapters')
      .select('publish_at')
      .eq('novel_id', novelId);

    const counts = countData?.reduce((acc: ChapterCounts, chapter: { publish_at: string | null }) => {
      const isAdvanced = chapter.publish_at && new Date(chapter.publish_at) > new Date();
      if (isAdvanced) {
        acc.advancedCount++;
      } else {
        acc.regularCount++;
      }
      return acc;
    }, { regularCount: 0, advancedCount: 0, total: countData?.length || 0 }) || 
    { regularCount: 0, advancedCount: 0, total: 0 };

    // Calculate pagination
    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages || 1);
    const offset = (safePage - 1) * limit;

    // Get chapters with pagination
    let chaptersQuery = supabase
      .from('chapters')
      .select(`
        id,
        chapter_number,
        part_number,
        title,
        publish_at,
        coins,
        age_rating,
        volume_id
      `)
      .eq('novel_id', novelId);

    // Add conditional filters
    if (volumeId !== null && volumeId !== undefined) {
      chaptersQuery = chaptersQuery.eq('volume_id', volumeId);
    }
    
    if (showAdvanced) {
      chaptersQuery = chaptersQuery.gt('publish_at', now);
    } else {
      chaptersQuery = chaptersQuery.or(`publish_at.lte.${now},publish_at.is.null`);
    }

    const { data: chapters, error } = await chaptersQuery
      .order('chapter_number', { ascending: true })
      .order('part_number', { ascending: true, nullsFirst: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching chapters for list:', error);
      return { chapters: [], counts, total, currentPage: 1, totalPages: 1 };
    }

    // If user is authenticated, get their unlocks in a single query
    let userUnlocks: number[] = [];
    if (userId) {
      const { data: unlocks } = await supabase
        .from('chapter_unlocks')
        .select('chapter_number')
        .eq('novel_id', novelId)
        .eq('profile_id', userId);
      
      userUnlocks = unlocks?.map(u => u.chapter_number) || [];
    }

    // Process chapters with unlock status
    const processedChapters = chapters?.map(chapter => ({
      ...chapter,
      isLocked: !userUnlocks.includes(chapter.chapter_number) && chapter.coins > 0
    })) || [];

    return {
      chapters: processedChapters,
      counts,
      total,
      currentPage: safePage,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching chapters for list:', error);
    return { 
      chapters: [], 
      counts: { regularCount: 0, advancedCount: 0, total: 0 },
      total: 0,
      currentPage: 1,
      totalPages: 1
    };
  }
}

export interface ChapterCounts {
  regularCount: number;
  advancedCount: number;
  total: number;
} 