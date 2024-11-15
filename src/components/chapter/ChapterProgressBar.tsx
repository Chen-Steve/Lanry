'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ChapterProgressBarProps {
  novelId: string;
  currentChapter: number;
  totalChapters: number;
  navigation: {
    prevChapter: { chapter_number: number } | null;
    nextChapter: { chapter_number: number } | null;
  };
}

export default function ChapterProgressBar({
  novelId,
  currentChapter,
  totalChapters,
  navigation
}: ChapterProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate base progress (progress from completed chapters)
  const baseProgress = ((currentChapter - 1) / totalChapters) * 100;

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      
      // Calculate progress within current chapter (0 to 1)
      const chapterProgress = Math.min(scrolled / documentHeight, 1);
      
      // Calculate the value of one chapter in terms of total percentage
      const chapterValue = 100 / totalChapters;
      
      // Combine base progress with current chapter progress
      const totalProgress = baseProgress + (chapterProgress * chapterValue);
      
      setScrollProgress(Math.min(totalProgress, 100));
    };

    // Initial calculation
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapter, totalChapters, baseProgress]);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }

      setIsVisible(true);

      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      setHideTimeout(timeout);
    };

    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isMobile, hideTimeout]);

  if (!isMobile) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-purple-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        {/* Chapter progress text */}
        <div className="text-sm text-gray-600">
          Chapter {currentChapter} of {totalChapters} ({Math.round(scrollProgress)}%)
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          {navigation.prevChapter ? (
            <Link
              href={`/novels/${novelId}/chapters/c${navigation.prevChapter.chapter_number}`}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Previous chapter"
            >
              <Icon icon="mdi:chevron-left" className="text-xl" />
            </Link>
          ) : (
            <button
              disabled
              className="p-2 text-gray-300 cursor-not-allowed"
              aria-label="No previous chapter"
            >
              <Icon icon="mdi:chevron-left" className="text-xl" />
            </button>
          )}

          {navigation.nextChapter ? (
            <Link
              href={`/novels/${novelId}/chapters/c${navigation.nextChapter.chapter_number}`}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Next chapter"
            >
              <Icon icon="mdi:chevron-right" className="text-xl" />
            </Link>
          ) : (
            <button
              disabled
              className="p-2 text-gray-300 cursor-not-allowed"
              aria-label="No next chapter"
            >
              <Icon icon="mdi:chevron-right" className="text-xl" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}