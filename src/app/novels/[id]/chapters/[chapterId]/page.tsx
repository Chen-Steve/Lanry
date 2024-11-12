'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
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
    // First try to get the novel by ID or slug
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

    // Now fetch the chapter
    if (chapterId.startsWith('c')) {
      const chapterNumber = parseInt(chapterId.slice(1));
      if (isNaN(chapterNumber)) {
        console.error('Invalid chapter number format');
        return null;
      }

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
        .eq('novel_id', actualNovelId)
        .eq('chapter_number', chapterNumber)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      
      return chapter as ChapterWithNovel;
    }

    // Handle direct chapter ID or slug lookup
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
      .or(`id.eq.${chapterId},slug.eq.${chapterId}`)
      .eq('novel_id', actualNovelId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

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

async function getTotalChapters(novelId: string) {
  try {
    // First get the novel's actual ID
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      console.error('Novel not found:', novelError);
      return 0;
    }

    const actualNovelId = novel.id;

    // Now get the total chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('chapter_number')
      .eq('novel_id', actualNovelId)
      .order('chapter_number', { ascending: false })
      .limit(1)
      .single();

    return chapters?.chapter_number || 0;
  } catch (error) {
    console.error('Error getting total chapters:', error);
    return 0;
  }
}

export default function ChapterPage({ params }: { params: { id: string; chapterId: string } }) {
  const { id: novelId, chapterId } = params;
  const [chapter, setChapter] = useState<ChapterWithNovel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigation, setNavigation] = useState<{
    prevChapter: { id: string; chapter_number: number; title: string } | null;
    nextChapter: { id: string; chapter_number: number; title: string } | null;
  }>({ prevChapter: null, nextChapter: null });
  const [totalChapters, setTotalChapters] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [chapterData, total] = await Promise.all([
        getChapter(novelId, chapterId),
        getTotalChapters(novelId)
      ]);
      
      setChapter(chapterData);
      setTotalChapters(total);
      
      if (chapterData) {
        const nav = await getChapterNavigation(novelId, chapterData.chapter_number);
        setNavigation(nav);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [novelId, chapterId]);

  const handleChapterSelect = (chapterNum: number) => {
    window.location.href = `/novels/${novelId}/chapters/c${chapterNum}`;
  };

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

      {/* End of Chapter Navigation */}
      <div className="flex flex-col gap-4 border-t pt-4">
        <div className="flex justify-between items-center gap-3">
          {/* Previous Chapter */}
          {navigation.prevChapter ? (
            <Link
              href={`/novels/${novelId}/chapters/c${navigation.prevChapter.chapter_number}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Icon icon="mdi:chevron-left" className="text-xl" />
              <span>Previous Chapter</span>
            </Link>
          ) : (
            <div className="invisible flex-1">
              <button className="px-4 py-2">Previous Chapter</button>
            </div>
          )}

          {/* Chapter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <span>Chapter {chapter.chapter_number}</span>
              <Icon icon="mdi:chevron-down" />
            </button>

            {isDropdownOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => handleChapterSelect(num)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      num === chapter.chapter_number ? 'bg-blue-50' : ''
                    }`}
                  >
                    Chapter {num}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Next Chapter */}
          {navigation.nextChapter ? (
            <Link
              href={`/novels/${novelId}/chapters/c${navigation.nextChapter.chapter_number}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span>Next Chapter</span>
              <Icon icon="mdi:chevron-right" className="text-xl" />
            </Link>
          ) : (
            <div className="invisible flex-1">
              <button className="px-4 py-2">Next Chapter</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 