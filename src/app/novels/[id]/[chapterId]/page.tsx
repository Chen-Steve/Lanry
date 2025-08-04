import { notFound } from 'next/navigation';
import ChapterPageClient from './ChapterPageClient';
import { getChapter, getChapterNavigation } from '@/services/chapterService';
import { createServerClient } from '@/lib/supabaseServer';

interface PageParams {
  params: {
    id: string; // novel id or slug
    chapterId: string; // formatted as c{number} or c{number}-p{part}
  };
}

export default async function ChapterPage({ params }: PageParams) {
  const { id: novelId, chapterId } = params;

  // Extract chapter and part numbers from the URL fragment
  const match = chapterId.match(/^c(\d+)(?:-p(\d+))?$/);
  if (!match) {
    return notFound();
  }

  const chapterNumber = parseInt(match[1], 10);
  const partNumber = match[2] ? parseInt(match[2], 10) : null;

  // Fetch current user once on the server
  const supabase = await createServerClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session?.user || null;



  // Fetch chapter data & navigation in parallel
  const [chapter, navigation] = await Promise.all([
    getChapter(novelId, chapterNumber, partNumber, supabase, user),
    getChapterNavigation(novelId, chapterNumber, partNumber, supabase, user),
  ]);

  // Handle missing chapter
  if (!chapter) {
    return notFound();
  }

  // Increment novel view count (fire-and-forget)
  try {
    await supabase.rpc('increment_novel_views', {
      novel_id_param: chapter.novel.id,
    });
  } catch (err) {
    console.error('Failed to increment view count', err);
  }

  return (
    <ChapterPageClient
      novelId={novelId}
      chapter={chapter}
      navigation={navigation}
      userId={user?.id ?? null}
    />
  );
}
