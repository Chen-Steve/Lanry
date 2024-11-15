'use client';

import { useEffect, useState, useRef } from 'react';
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
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Calculate base progress (progress from completed chapters)
  const baseProgress = ((currentChapter - 1) / totalChapters) * 100;

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      
      const chapterProgress = Math.min(scrolled / documentHeight, 1);
      const chapterValue = 100 / totalChapters;
      const totalProgress = baseProgress + (chapterProgress * chapterValue);
      
      setScrollProgress(Math.min(totalProgress, 100));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapter, totalChapters, baseProgress]);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if the touch is outside the progress bar
      if (progressBarRef.current && !progressBarRef.current.contains(e.target as Node)) {
        if (isVisible) {
          // If the bar is visible and we tap outside, hide it
          setIsVisible(false);
          if (hideTimeout) {
            clearTimeout(hideTimeout);
          }
          return;
        }
      }

      // Show the bar and reset the timeout
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
  }, [isMobile, hideTimeout, isVisible]);

  if (!isMobile) return null;

  return (
    <div
      ref={progressBarRef}
      className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-transform duration-300 py-4 rounded-t-md ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Progress container */}
      <div className="px-4 mb-4">
        <div className="bg-gray-50 rounded-md p-4">
          {/* Chapter info - centered */}
          <div className="mb-4 text-center">
            <div className="text-sm text-gray-600">
              {Math.round(scrollProgress)}% - Chapter {currentChapter} of {totalChapters}
            </div>
          </div>

          {/* Navigation with progress bar */}
          <div className="flex items-center gap-2">
            {/* Previous button */}
            {navigation.prevChapter ? (
              <Link
                href={`/novels/${novelId}/chapters/c${navigation.prevChapter.chapter_number}`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
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

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Next button */}
            {navigation.nextChapter ? (
              <Link
                href={`/novels/${novelId}/chapters/c${navigation.nextChapter.chapter_number}`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
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

      {/* Empty space for future features */}
      <div className="px-4 h-16">
        {/* Future content will go here */}
      </div>
    </div>
  );
}