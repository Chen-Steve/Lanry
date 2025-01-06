import supabase from '@/lib/supabaseClient';
import { Chapter, Novel } from '@/types/database';

type ChapterWithNovel = Chapter & {
  novel: Novel;
  isLocked?: boolean;
};

export async function getChapter(novelId: string, chapterId: string): Promise<ChapterWithNovel | null> {
  try {
    // Parse chapter number and part number from the URL
    const match = chapterId.match(/^c(\d+)(?:-p(\d+))?$/);
    if (!match) {
      console.error('Invalid chapter ID format');
      return null;
    }
    
    const chapterNumber = parseInt(match[1]);
    const partNumber = match[2] ? parseInt(match[2]) : null;

    if (isNaN(chapterNumber)) {
      console.error('Invalid chapter number format');
      return null;
    }

    // Get the novel first to verify it exists
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, slug')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      console.error('Novel not found:', novelError);
      return null;
    }

    // console.log('Found novel:', novel);

    // Get the user first
    const { data: { user } } = await supabase.auth.getUser();

    // First get the chapter
    let query = supabase
      .from('chapters')
      .select(`
        *,
        id,
        title,
        content,
        chapter_number,
        part_number,
        publish_at,
        coins,
        author_thoughts,
        novel:novels!inner (
          id,
          title,
          author
        )
      `)
      .eq('novel_id', novel.id)
      .eq('chapter_number', chapterNumber);

    // Add part number to query if it exists
    if (partNumber !== null) {
      query = query.eq('part_number', partNumber);
    }

    // First try to get the exact match
    let { data: chapter, error: chapterError } = await query.maybeSingle();

    // If no exact match found and no part number was specified, try without part number condition
    if (!chapter && partNumber === null) {
      // console.log('No exact match found, trying without part number condition');
      query = supabase
        .from('chapters')
        .select(`
          *,
          id,
          title,
          content,
          chapter_number,
          part_number,
          publish_at,
          coins,
          author_thoughts,
          novel:novels!inner (
            id,
            title,
            author
          )
        `)
        .eq('novel_id', novel.id)
        .eq('chapter_number', chapterNumber)
        .order('part_number', { ascending: true })
        .limit(1);

      const result = await query;
      chapter = result.data?.[0];
      chapterError = result.error;
    }

    if (chapterError || !chapter) {
      // console.error('Chapter fetch error:', chapterError);
      return null;
    }

    const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
    let isUnlocked = false;

    // If user is authenticated, check for unlocks
    if (user) {
      try {
        const { data: unlocks, error: unlockError } = await supabase
          .from('chapter_unlocks')
          .select('profile_id')
          .eq('novel_id', novel.id)
          .eq('chapter_number', chapterNumber)
          .eq('profile_id', user.id)
          .maybeSingle();

        if (!unlockError && unlocks) {
          isUnlocked = true;
        }
      } catch (error) {
        console.error('Error checking chapter unlock status:', error);
        isUnlocked = false;
      }
    }

    return {
      ...chapter,
      isLocked: !isPublished && !isUnlocked
    } as ChapterWithNovel;

  } catch (error) {
    console.error('Error in getChapter:', error);
    return null;
  }
}

export async function getChapterNavigation(novelId: string, currentChapterNumber: number) {
  try {
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
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

    // Filter chapters that are either published or unlocked
    const accessibleChapters = chapters.filter(chapter => {
      const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
      const isUnlocked = userUnlocks.includes(chapter.chapter_number);
      return isPublished || isUnlocked;
    });

    const currentIndex = accessibleChapters.findIndex(ch => ch.chapter_number === currentChapterNumber);
    
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