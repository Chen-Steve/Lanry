'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Chapter, Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';

type ChapterWithNovel = Chapter & {
  novel: Novel;
};

async function getChapter(novelId: string, chapterId: string): Promise<ChapterWithNovel | null> {
  try {
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select(`
        *,
        novel:novels (
          id,
          title,
          author
        )
      `)
      .eq('id', chapterId)
      .eq('novel_id', novelId)
      .single();

    if (error) throw error;
    if (!chapter) return null;

    return chapter as ChapterWithNovel;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }
}

async function getChapterNavigation(novelId: string, currentChapterNumber: number) {
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('novel_id', novelId)
    .order('chapter_number');

  if (!chapters) return { prevChapter: null, nextChapter: null };

  const currentIndex = chapters.findIndex(ch => ch.chapter_number === currentChapterNumber);
  
  return {
    prevChapter: currentIndex > 0 ? chapters[currentIndex - 1] : null,
    nextChapter: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null,
  };
}

export default function ChapterPage({ 
  params 
}: { 
  params: { id: string; chapterId: string } 
}) {
  const { id: novelId, chapterId } = params;
  const [chapter, setChapter] = useState<ChapterWithNovel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigation, setNavigation] = useState<{
    prevChapter: { id: string; chapter_number: number; title: string } | null;
    nextChapter: { id: string; chapter_number: number; title: string } | null;
  }>({ prevChapter: null, nextChapter: null });

  useEffect(() => {
    const fetchChapter = async () => {
      const data = await getChapter(novelId, chapterId);
      setChapter(data);
      
      if (data) {
        const nav = await getChapterNavigation(novelId, data.chapter_number);
        setNavigation(nav);
      }
      
      setIsLoading(false);
    };
    
    fetchChapter();
  }, [novelId, chapterId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!chapter) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
      {/* Navigation Header */}
      <div className="mb-6 md:mb-8">
        <Link 
          href={`/novels/${novelId}`}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm md:text-base"
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back to Novel</span>
        </Link>
        <h1 className="text-xl md:text-2xl font-bold mt-3">{chapter.novel.title}</h1>
        <p className="text-sm md:text-base text-gray-600">by {chapter.novel.author}</p>
      </div>

      {/* Chapter Content */}
      <div className="mb-6 md:mb-8">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            Chapter {chapter.chapter_number}: {chapter.title}
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            Published {formatDate(chapter.created_at)}
          </p>
        </div>
        
        <div className="prose prose-sm md:prose-base max-w-none">
          {chapter.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="flex justify-between items-center gap-3 border-t pt-4">
        {navigation.prevChapter ? (
          <Link
            href={`/novels/${novelId}/chapters/${navigation.prevChapter.id}`}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Icon icon="mdi:chevron-left" className="flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-600">Previous</div>
              <div className="text-sm truncate">
                Chapter {navigation.prevChapter.chapter_number}: {navigation.prevChapter.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {navigation.nextChapter ? (
          <Link
            href={`/novels/${novelId}/chapters/${navigation.nextChapter.id}`}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors ml-auto"
          >
            <div className="min-w-0">
              <div className="text-xs text-gray-600">Next</div>
              <div className="text-sm truncate">
                Chapter {navigation.nextChapter.chapter_number}: {navigation.nextChapter.title}
              </div>
            </div>
            <Icon icon="mdi:chevron-right" className="flex-shrink-0" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Fixed Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 sm:hidden">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="w-1/3">
            {navigation.prevChapter && (
              <Link
                href={`/novels/${novelId}/chapters/${navigation.prevChapter.id}`}
                className="flex flex-col items-start px-2 py-1"
              >
                <span className="text-xs text-gray-500">Previous</span>
                <span className="text-sm truncate">Ch. {navigation.prevChapter.chapter_number}</span>
              </Link>
            )}
          </div>

          <Link
            href={`/novels/${novelId}`}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100"
          >
            <Icon icon="mdi:book-open-variant" className="text-xl" />
          </Link>

          <div className="w-1/3 text-right">
            {navigation.nextChapter && (
              <Link
                href={`/novels/${novelId}/chapters/${navigation.nextChapter.id}`}
                className="flex flex-col items-end px-2 py-1"
              >
                <span className="text-xs text-gray-500">Next</span>
                <span className="text-sm truncate">Ch. {navigation.nextChapter.chapter_number}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Padding for Mobile Navigation */}
      <div className="h-16 sm:hidden" />
    </div>
  );
} 