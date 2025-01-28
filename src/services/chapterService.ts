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

    // Check if user is the author
    const isAuthor = user && novel.author_profile_id === user.id;

    // If user is author, they can access all chapters
    if (isAuthor) {
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
      .select('id, author_profile_id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return { prevChapter: null, nextChapter: null, availableChapters: [], volumes: [] };

    const { data: { user } } = await supabase.auth.getUser();

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

    // Check if user is the author
    const isAuthor = user && novel.author_profile_id === user.id;

    // Filter chapters that are either published, unlocked, or if user is the author
    const accessibleChapters = chapters.filter(chapter => {
      if (isAuthor) return true; // Author can access all chapters
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
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) return 0;

    const { data: { user } } = await supabase.auth.getUser();

    // Get all chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('chapter_number, publish_at, coins')
      .eq('novel_id', novel.id)
      .order('chapter_number', { ascending: false });

    if (!chapters) return 0;

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
  userId
}: ChapterListParams) {
  try {
    const { data: novel } = await supabase
      .from('novels')
      .select('id, author_profile_id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (!novel) return { chapters: [], total: 0 };

    // Check if user is author
    const isAuthor = userId && novel.author_profile_id === userId;

    // Base query with minimal fields needed for list
    const query = supabase
      .from('chapters')
      .select(`
        id,
        chapter_number,
        part_number,
        title,
        publish_at,
        coins,
        volume_id,
        age_rating
      `, { count: 'exact' })
      .eq('novel_id', novel.id)
      .order('chapter_number')
      .order('part_number', { nullsFirst: true })
      .range((page - 1) * limit, page * limit - 1);

    // If not author, we need to check unlocks
    if (!isAuthor) {
      // Get user unlocks in a separate query to avoid joins
      let unlockedChapterNumbers: number[] = [];
      if (userId) {
        const { data: unlocks } = await supabase
          .from('chapter_unlocks')
          .select('chapter_number')
          .eq('novel_id', novel.id)
          .eq('profile_id', userId);
        
        unlockedChapterNumbers = unlocks?.map(u => u.chapter_number) || [];
      }

      const now = new Date();
      const { data: chapters, count } = await query;

      // Show all chapters, the locking logic is handled in the UI
      const filteredChapters = chapters || [];

      console.log('Filtered chapters:', {
        total: chapters?.length || 0,
        filtered: filteredChapters.length,
        advanced: filteredChapters.filter(ch => ch.publish_at && new Date(ch.publish_at) > now).length,
        unlocked: unlockedChapterNumbers.length
      });

      return {
        chapters: filteredChapters as ChapterListItem[],
        total: count || 0
      };
    }

    // For authors, return all chapters
    const { data: chapters, count } = await query;
    
    return {
      chapters: (chapters || []) as ChapterListItem[],
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching chapters for list:', error);
    return { chapters: [], total: 0 };
  }
}

export interface ChapterCounts {
  regularCount: number;
  advancedCount: number;
  total: number;
}

export async function getChapterCounts(novelId: string): Promise<ChapterCounts> {
  try {
    const { data: novel } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (!novel) return { regularCount: 0, advancedCount: 0, total: 0 };

    const { count } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novel.id);

    const now = new Date().toISOString();

    const { count: advancedCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novel.id)
      .gt('publish_at', now);

    const regularCount = (count || 0) - (advancedCount || 0);

    return {
      regularCount,
      advancedCount: advancedCount || 0,
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting chapter counts:', error);
    return { regularCount: 0, advancedCount: 0, total: 0 };
  }
} 