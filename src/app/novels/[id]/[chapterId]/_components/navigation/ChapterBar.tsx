'use client';

import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import TextCustomization from '../interaction/TextCustomization';

interface ChapterProgressBarProps {
  novelId: string;
  currentChapter: number;
  totalChapters: number;
  navigation: {
    prevChapter: { chapter_number: number } | null;
    nextChapter: { chapter_number: number } | null;
  };
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
  isCommentOpen: boolean;
  isDropdownOpen: boolean;
  firstChapter: number;
}

export default function ChapterProgressBar({
  novelId,
  currentChapter,
  totalChapters,
  navigation,
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
  isCommentOpen,
  isDropdownOpen,
  firstChapter,
}: ChapterProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      
      // Calculate progress within current chapter (0 to 1)
      const chapterProgress = Math.min(scrolled / documentHeight, 1);
      
      // Calculate total chapters in range
      const totalChaptersInRange = (firstChapter + totalChapters - 1) - firstChapter + 1;
      
      // Calculate completed chapters
      const completedChapters = currentChapter - firstChapter;
      
      // Calculate base progress percentage
      const baseProgress = (completedChapters / totalChaptersInRange) * 100;
      
      // Add current chapter progress
      const currentChapterContribution = (chapterProgress / totalChaptersInRange) * 100;
      
      // Calculate final progress
      const finalProgress = baseProgress + currentChapterContribution;
      
      // Ensure progress stays within 0-100 range
      setScrollProgress(Math.min(Math.max(finalProgress, 0), 100));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapter, totalChapters, firstChapter]);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isCommentOpen || isDropdownOpen) return;
      
      // Ignore if the touch is on a link, button, or form element
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'textarea' ||
        target.tagName.toLowerCase() === 'form' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('textarea') ||
        target.closest('form')
      ) {
        return;
      }
      
      setTouchStartY(e.touches[0].clientY);
      setIsTouching(true);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isCommentOpen || isDropdownOpen) return;
      
      if (!touchStartY || !isTouching) return;

      const target = e.target as HTMLElement;
      // Ignore if the touch ended on a link, button, or form element
      if (
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'textarea' ||
        target.tagName.toLowerCase() === 'form' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('textarea') ||
        target.closest('form')
      ) {
        setTouchStartY(null);
        setIsTouching(false);
        return;
      }

      const touchEndY = e.changedTouches[0].clientY;
      const touchDistance = Math.abs(touchEndY - touchStartY);

      if (touchDistance < 10) {
        if (
          !(e.target as HTMLElement).closest('[role="scrollbar"]') &&
          !(progressBarRef.current?.contains(e.target as Node))
        ) {
          setIsVisible(prev => !prev);
        }
      }

      setTouchStartY(null);
      setIsTouching(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, touchStartY, isTouching, isCommentOpen, isDropdownOpen]);

  useEffect(() => {
    if ((isCommentOpen || isDropdownOpen) && isVisible) {
      setIsVisible(false);
    }
  }, [isCommentOpen, isDropdownOpen, isVisible]);

  if (!isMobile) return null;

  return (
    <div
      ref={progressBarRef}
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg transition-all duration-300 rounded-t-md ${
        isVisible 
          ? 'translate-y-0 py-6 min-h-[180px]'
          : 'translate-y-full'
      }`}
    >
      <div className="px-4 space-y-6">
        {/* Progress Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
          {/* Chapter info - centered */}
          <div className="mb-4 text-center h-5">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Chapter {currentChapter}/{firstChapter + totalChapters - 1} - {Math.round(scrollProgress)}%
            </div>
          </div>

          {/* Navigation with progress bar */}
          <div className="flex items-center gap-2 h-8">
            {/* Previous button */}
            <div className="w-8 h-8 flex-shrink-0">
              {navigation.prevChapter ? (
                <Link
                  href={`/novels/${novelId}/c${navigation.prevChapter.chapter_number}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-black dark:text-white h-full w-full flex items-center justify-center"
                  aria-label="Previous chapter"
                >
                  <Icon icon="mdi:chevron-left" className="text-xl" />
                </Link>
              ) : (
                <button
                  disabled
                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed h-full w-full flex items-center justify-center"
                  aria-label="No previous chapter"
                >
                  <Icon icon="mdi:chevron-left" className="text-xl" />
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Next button */}
            <div className="w-8 h-8 flex-shrink-0">
              {navigation.nextChapter ? (
                <Link
                  href={`/novels/${novelId}/c${navigation.nextChapter.chapter_number}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-black dark:text-white h-full w-full flex items-center justify-center"
                  aria-label="Next chapter"
                >
                  <Icon icon="mdi:chevron-right" className="text-xl" />
                </Link>
              ) : (
                <button
                  disabled
                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed h-full w-full flex items-center justify-center"
                  aria-label="No next chapter"
                >
                  <Icon icon="mdi:chevron-right" className="text-xl" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Novel Details Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
          <Link
            href={`/novels/${novelId}`}
            className="flex items-center justify-center gap-2 w-full py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Icon icon="mdi:book-open-variant" className="text-xl" />
            <span>Novel Details</span>
          </Link>
        </div>

        {/* Text Customization Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
          <TextCustomization
            onFontChange={onFontChange}
            onSizeChange={onSizeChange}
            currentFont={currentFont}
            currentSize={currentSize}
          />
        </div>
      </div>
    </div>
  );
}