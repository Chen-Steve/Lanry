import supabase from '@/lib/supabaseClient';
import { Chapter, Novel } from '@/types/database';

type ChapterWithNovel = Chapter & {
  novel: Novel;
};

export async function getChapter(novelId: string, chapterId: string): Promise<ChapterWithNovel | null> {
  try {
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      console.error('Novel not found:', novelError);
      return null;
    }

    const actualNovelId = novel.id;
    const now = new Date().toISOString();

    if (chapterId.startsWith('c')) {
      const chapterNumber = parseInt(chapterId.slice(1));
      if (isNaN(chapterNumber)) return null;

      const { data: chapter, error } = await supabase
        .from('chapters')
        .select(`*, novel:novels (id, title, author)`)
        .eq('novel_id', actualNovelId)
        .eq('chapter_number', chapterNumber)
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .single();

      if (error) return null;

      if (chapter.publish_at && new Date(chapter.publish_at) > new Date()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data: unlock } = await supabase
          .from('chapter_unlocks')
          .select('id')
          .eq('profile_id', session.user.id)
          .eq('novel_id', actualNovelId)
          .eq('chapter_number', chapterNumber)
          .single();

        if (!unlock) return null; // Chapter not unlocked
      }

      return chapter as ChapterWithNovel;
    }

    const { data: chapter, error } = await supabase
      .from('chapters')
      .select(`*, novel:novels (id, title, author)`)
      .or(`id.eq.${chapterId},slug.eq.${chapterId}`)
      .eq('novel_id', actualNovelId)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .single();

    if (error) return null;

    if (chapter.publish_at && new Date(chapter.publish_at) > new Date()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: unlock } = await supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('profile_id', session.user.id)
        .eq('novel_id', actualNovelId)
        .eq('chapter_number', chapter.chapter_number)
        .single();

      if (!unlock) return null; // Chapter not unlocked
    }

    return chapter as ChapterWithNovel;
  } catch (error) {
    console.error('Error fetching chapter:', error);
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

    if (novelError || !novel) return { prevChapter: null, nextChapter: null };

    const actualNovelId = novel.id;
    const now = new Date().toISOString();

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, title')
      .eq('novel_id', actualNovelId)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .order('chapter_number');

    if (!chapters || chapters.length === 0) {
      return { prevChapter: null, nextChapter: null };
    }

    const currentIndex = chapters.findIndex(ch => ch.chapter_number === currentChapterNumber);
    
    return {
      prevChapter: currentIndex > 0 ? chapters[currentIndex - 1] : null,
      nextChapter: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null,
    };
  } catch (error) {
    console.error('Error fetching chapter navigation:', error);
    return { prevChapter: null, nextChapter: null };
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

    const actualNovelId = novel.id;
    const now = new Date().toISOString();

    const { data: chapters } = await supabase
      .from('chapters')
      .select('chapter_number')
      .eq('novel_id', actualNovelId)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .order('chapter_number', { ascending: false })
      .limit(1)
      .single();

    return chapters?.chapter_number || 0;
  } catch (error) {
    console.error('Error getting total chapters:', error);
    return 0;
  }
} 