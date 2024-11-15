'use client';

import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import TextCustomization from './TextCustomization';

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
}

export default function ChapterProgressBar({
  novelId,
  currentChapter,
  totalChapters,
  navigation,
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize
}: ChapterProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);

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
      // Store the initial touch position
      setTouchStartY(e.touches[0].clientY);
      setIsTouching(true);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartY) return;

      // Calculate the distance moved
      const touchEndY = e.changedTouches[0].clientY;
      const touchDistance = Math.abs(touchEndY - touchStartY);

      // If the touch was more of a tap (moved less than 10px) and not a scroll
      if (touchDistance < 10 && isTouching) {
        // Ignore touch events that come from scrolling or from the progress bar itself
        if (
          !(e.target as HTMLElement).closest('[role="scrollbar"]') &&
          !(progressBarRef.current?.contains(e.target as Node))
        ) {
          if (isVisible) {
            // If the bar is visible and we tap outside, hide it
            setIsVisible(false);
            if (hideTimeout) {
              clearTimeout(hideTimeout);
            }
          } else {
            // Show the bar and set the timeout
            setIsVisible(true);
            const timeout = setTimeout(() => {
              setIsVisible(false);
            }, 3000);
            setHideTimeout(timeout);
          }
        }
      }

      // Reset touch tracking
      setTouchStartY(null);
      setIsTouching(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isMobile, hideTimeout, isVisible, touchStartY, isTouching]);

  if (!isMobile) return null;

  return (
    <div
      ref={progressBarRef}
      className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-all duration-300 rounded-t-md ${
        isVisible 
          ? 'translate-y-0 py-6 min-h-[180px]'
          : 'translate-y-full'
      }`}
    >
      <div className="px-4 space-y-6">
        {/* Progress Section */}
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

        {/* Text Customization Section */}
        <div className="bg-gray-50 rounded-md p-4">
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