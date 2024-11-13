'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { Chapter, Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import TextCustomization from '@/components/chapter/TextCustomization';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
    const now = new Date().toISOString();

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
        .or(`publish_at.is.null,publish_at.lte.${now}`)
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
      .or(`publish_at.is.null,publish_at.lte.${now}`)
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
  try {
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      console.error('Novel not found:', novelError);
      return { prevChapter: null, nextChapter: null };
    }

    const actualNovelId = novel.id;
    const now = new Date().toISOString();

    // Now fetch chapters with the actual novel ID and respect publish dates
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

async function getTotalChapters(novelId: string) {
  try {
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
    const now = new Date().toISOString();

    // Now get the total published chapters
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

// First, create a ChapterNavigation component (at the top of the file)
function ChapterNavigation({ 
  navigation, 
  novelId, 
  currentChapter, 
  totalChapters, 
  isDropdownOpen, 
  setIsDropdownOpen, 
  handleChapterSelect,
  position = 'bottom'
}: {
  navigation: {
    prevChapter: { chapter_number: number } | null;
    nextChapter: { chapter_number: number } | null;
  };
  novelId: string;
  currentChapter: number;
  totalChapters: number;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  handleChapterSelect: (num: number) => void;
  position?: 'top' | 'bottom';
}) {
  const dropdownPosition = position === 'top' 
    ? 'top-full left-1/2 -translate-x-1/2 mt-2' 
    : 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <div className="flex flex-col gap-3">
      {/* Chapter Selector */}
      <div className="relative w-full">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <span>Chapter {currentChapter}</span>
          <Icon icon="mdi:chevron-down" />
        </button>

        {isDropdownOpen && (
          <div className={`absolute ${dropdownPosition} w-48 max-h-[60vh] overflow-y-auto bg-white border rounded-lg shadow-lg z-50 left-1/2 -translate-x-1/2`}>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleChapterSelect(num)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  num === currentChapter ? 'bg-blue-50' : ''
                }`}
              >
                Chapter {num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-3">
        {/* Previous Chapter */}
        <div className="flex-1 min-w-[120px]">
          {navigation.prevChapter ? (
            <Link
              href={`/novels/${novelId}/chapters/c${navigation.prevChapter.chapter_number}`}
              className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:chevron-left" className="text-xl" />
                <span className="hidden sm:inline">Previous</span>
                <span>Ch.{navigation.prevChapter.chapter_number}</span>
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block px-4 py-2 text-gray-500">No previous chapter</div>
          )}
        </div>

        {/* Next Chapter */}
        <div className="flex-1 min-w-[120px]">
          {navigation.nextChapter ? (
            <Link
              href={`/novels/${novelId}/chapters/c${navigation.nextChapter.chapter_number}`}
              className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Next</span>
                <span>Ch.{navigation.nextChapter.chapter_number}</span>
                <Icon icon="mdi:chevron-right" className="text-xl" />
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block px-4 py-2 text-gray-500">No next chapter</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled more than 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 p-3 bg-gray-800 text-white rounded-full shadow-lg transition-opacity duration-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <Icon icon="mdi:chevron-up" className="text-xl" />
    </button>
  );
}

export default function ChapterPage({ params }: { params: { id: string; chapterId: string } }) {
  const { id: novelId, chapterId } = params;
  const [chapter, setChapter] = useState<ChapterWithNovel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<{
    prevChapter: { id: string; chapter_number: number; title: string } | null;
    nextChapter: { id: string; chapter_number: number; title: string } | null;
  }>({ prevChapter: null, nextChapter: null });
  const [totalChapters, setTotalChapters] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fontFamily, setFontFamily] = useLocalStorage(
    'chapter-font-family',
    'ui-sans-serif, system-ui, sans-serif'
  );
  const [fontSize, setFontSize] = useLocalStorage('chapter-font-size', 16);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const chapterData = await getChapter(novelId, chapterId);
        
        if (!chapterData) {
          setError('Advanced Chapter');
          return;
        }

        // Check if chapter is published
        if (chapterData.publish_at && new Date(chapterData.publish_at) > new Date()) {
          setError('This chapter is not yet available');
          return;
        }

        setChapter(chapterData);
        
        // Fetch navigation and total chapters only if the chapter is accessible
        const [nav, total] = await Promise.all([
          getChapterNavigation(novelId, chapterData.chapter_number),
          getTotalChapters(novelId)
        ]);
        
        setNavigation(nav);
        setTotalChapters(total);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [novelId, chapterId]);

  const handleChapterSelect = (chapterNum: number) => {
    window.location.href = `/novels/${novelId}/chapters/c${chapterNum}`;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/novels/${novelId}`}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm md:text-base mb-8"
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back to Novel</span>
        </Link>
        
        <div className="text-center py-12">
          <Icon 
            icon="mdi:lock" 
            className="mx-auto text-4xl text-gray-400 mb-4"
          />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error}
          </h1>
          {error === 'This chapter is not yet available' && chapter && (
            <p className="text-gray-500">
              This chapter will be available on {formatDate(chapter.publish_at!)}
            </p>
          )}
        </div>
      </div>
    );
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
        <div className="flex justify-between items-center mt-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{chapter.novel.title}</h1>
            <p className="text-sm md:text-base text-gray-600">by {chapter.novel.author}</p>
          </div>
          <TextCustomization
            currentFont={fontFamily}
            currentSize={fontSize}
            onFontChange={setFontFamily}
            onSizeChange={setFontSize}
          />
        </div>
      </div>

      {/* Top Navigation */}
      <div className="mb-6">
        <ChapterNavigation
          navigation={navigation}
          novelId={novelId}
          currentChapter={chapter.chapter_number}
          totalChapters={totalChapters}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          handleChapterSelect={handleChapterSelect}
          position="top"
        />
      </div>

      {/* Chapter Content */}
      <div className="mb-6 md:mb-8">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              Chapter {chapter.chapter_number}: {chapter.title}
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Published {formatDate(chapter.created_at)}
            </p>
          </div>
        </div>
        
        <div 
          className="prose prose-sm md:prose-base max-w-none"
          style={{ 
            fontFamily: fontFamily,
            fontSize: `${fontSize}px`
          }}
        >
          {chapter.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t pt-4">
        <ChapterNavigation
          navigation={navigation}
          novelId={novelId}
          currentChapter={chapter.chapter_number}
          totalChapters={totalChapters}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          handleChapterSelect={handleChapterSelect}
          position="bottom"
        />
      </div>

      {/* Add the ScrollToTop button */}
      <ScrollToTopButton />
    </div>
  );
} 