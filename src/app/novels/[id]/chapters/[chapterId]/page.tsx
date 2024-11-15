'use client';

import { useEffect, useState } from 'react';
import { getChapter, getChapterNavigation, getTotalChapters } from '@/services/chapterService';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { ChapterWithNovel } from '@/types/database';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChapterHeader from '@/components/chapter/ChapterHeader';
import ChapterContent from '@/components/chapter/ChapterContent';
import supabase from '@/lib/supabaseClient';

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
    <div className="flex items-center justify-center gap-2">
      {/* Previous Chapter */}
      <div className="w-auto">
        {navigation.prevChapter ? (
          <Link
            href={`/novels/${novelId}/chapters/c${navigation.prevChapter.chapter_number}`}
            className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-black transition-colors text-sm whitespace-nowrap"
          >
            <div className="flex items-center gap-1">
              <Icon icon="mdi:chevron-left" className="text-lg" />
              <span className="hidden sm:inline">Ch.{navigation.prevChapter.chapter_number}</span>
              <span className="sm:hidden">Previous</span>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block px-3 py-2 text-gray-400 text-sm">Ch.1</div>
        )}
      </div>

      {/* Chapter Selector */}
      <div className="relative w-[160px]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-3 py-2 border rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-black text-sm"
        >
          <span>Chapter {currentChapter}</span>
          <Icon icon="mdi:chevron-down" className="text-lg" />
        </button>

        {isDropdownOpen && (
          <div className={`absolute ${dropdownPosition} w-44 max-h-[60vh] overflow-y-auto bg-white border rounded-lg shadow-lg z-50 left-1/2 -translate-x-1/2`}>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleChapterSelect(num)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-black text-sm ${
                  num === currentChapter ? 'bg-blue-50' : ''
                }`}
              >
                Chapter {num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next Chapter */}
      <div className="w-auto">
        {navigation.nextChapter ? (
          <Link
            href={`/novels/${novelId}/chapters/c${navigation.nextChapter.chapter_number}`}
            className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-black transition-colors text-sm whitespace-nowrap"
          >
            <div className="flex items-center gap-1">
              <span className="hidden sm:inline">Ch.{navigation.nextChapter.chapter_number}</span>
              <span className="sm:hidden">Next</span>
              <Icon icon="mdi:chevron-right" className="text-lg" />
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block px-3 py-2 text-gray-400 text-sm text-right">Ch.{totalChapters}</div>
        )}
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

// Add this function near the top of the file
const updateReadingHistory = async (
  novelId: string, 
  chapterNumber: number
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First, get the actual novel ID if we're using a slug
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      console.error('Error getting novel:', novelError);
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('reading_history')
      .upsert({
        id: crypto.randomUUID(),
        profile_id: user.id,
        novel_id: novel.id,
        last_chapter: chapterNumber,
        last_read: now,
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'profile_id,novel_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating reading history:', error);
  }
};

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
          setError('Chapter not found');
          return;
        }

        // Check if chapter is locked
        if (chapterData.isLocked) {
          setError('This chapter is not yet available');
          setChapter(chapterData); // We still set the chapter to show publish date if available
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

  useEffect(() => {
    if (chapter) {
      updateReadingHistory(novelId, chapter.chapter_number);
    }
  }, [novelId, chapter]);

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
          className="text-black hover:text-gray-700 flex items-center gap-1 text-sm md:text-base mb-8"
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
            <div className="space-y-2">
              <p className="text-gray-500">
                {chapter.publish_at ? 
                  `This chapter will be available on ${formatDate(chapter.publish_at)}` :
                  'This chapter requires unlocking to read'}
              </p>
              <Link
                href={`/novels/${novelId}`}
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Novel Page to Unlock
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!chapter) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
      <ChapterHeader
        novelId={novelId}
        novelTitle={chapter.novel.title}
        author={chapter.novel.author}
        fontFamily={fontFamily}
        fontSize={fontSize}
        onFontChange={setFontFamily}
        onSizeChange={setFontSize}
      />

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

      {/* Replace the chapter content section with the new component */}
      <ChapterContent
        novelId={chapter.novel.id}
        chapterNumber={chapter.chapter_number}
        title={chapter.title}
        createdAt={chapter.created_at}
        content={chapter.content}
        fontFamily={fontFamily}
        fontSize={fontSize}
      />

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

      <ScrollToTopButton />
    </div>
  );
} 