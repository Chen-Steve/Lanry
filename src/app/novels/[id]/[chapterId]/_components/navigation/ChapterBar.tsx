'use client';

import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import TextCustomization from '../interaction/TextCustomization';

// Utility function to process the cover URL similar to other components
const getProcessedCoverUrl = (coverUrl?: string): string => {
  if (!coverUrl) return '';
  return coverUrl.startsWith('http') ? coverUrl : `/novel-covers/${coverUrl}`;
};

// Use this to check if a URL is valid
const isValidUrl = (url?: string): boolean => {
  if (!url) return false;
  // Simple check for non-empty string
  return url.trim() !== '';
};

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
  firstChapter: number;
  novelCoverUrl?: string;
  novelTitle?: string;
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
  firstChapter,
  novelCoverUrl,
  novelTitle,
}: ChapterProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  // Debug cover URL issues
  useEffect(() => {
    console.log("Novel Cover Debugging:");
    console.log("- Novel Cover URL:", novelCoverUrl);
    console.log("- Processed URL:", getProcessedCoverUrl(novelCoverUrl));
    console.log("- Novel Title:", novelTitle);
  }, [novelCoverUrl, novelTitle]);

  // Listen for double tap custom event
  useEffect(() => {
    const handleToggleChapterBar = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.isVisible === 'boolean') {
        setIsVisible(event.detail.isVisible);
      } else {
        // Toggle if no specific value is provided
        setIsVisible(!isVisible);
      }
    };

    // Add event listener for the custom event
    document.addEventListener('toggleChapterBar', handleToggleChapterBar as EventListener);

    return () => {
      document.removeEventListener('toggleChapterBar', handleToggleChapterBar as EventListener);
    };
  }, [isVisible]);

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
      setTouchStartY(e.touches[0].clientY);
      setIsTouching(true);
    };

    const handleTouchEnd = () => {
      setTouchStartY(null);
      setIsTouching(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, touchStartY, isTouching, isCommentOpen]);

  useEffect(() => {
    if (isCommentOpen && isVisible) {
      setIsVisible(false);
    }
  }, [isCommentOpen, isVisible]);

  // Add a click handler to close the bar when clicking outside
  useEffect(() => {
    if (!isVisible || !isMobile) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        progressBarRef.current && 
        !progressBarRef.current.contains(event.target as Node) &&
        isVisible
      ) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isVisible, isMobile]);

  if (!isMobile) return null;

  return (
    <div
      ref={progressBarRef}
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg transition-all duration-300 rounded-t-2xl ${
        isVisible 
          ? 'translate-y-0 py-4 min-h-[220px]'
          : 'translate-y-full'
      }`}
    >
      <div className="px-4 space-y-3">
        {/* Drag indicator */}
        <div className="flex justify-center -mt-1 mb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Close button for mobile */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-gray-500 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="Close chapter options"
        >
          <Icon icon="mdi:close" className="text-lg" />
        </button>

        {/* Progress Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          {/* Chapter info - centered */}
          <div className="mb-2 text-center">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-300">
              Chapter {currentChapter} of {firstChapter + totalChapters - 1}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(scrollProgress)}% complete
            </div>
          </div>

          {/* Navigation with progress bar */}
          <div className="flex items-center gap-2 h-8 mt-3">
            {/* Previous button */}
            <div className="w-8 h-8 flex-shrink-0">
              {navigation.prevChapter ? (
                <Link
                  href={`/novels/${novelId}/c${navigation.prevChapter.chapter_number}`}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-300 h-full w-full flex items-center justify-center"
                  aria-label="Previous chapter"
                >
                  <Icon icon="mdi:chevron-left" className="text-xl" />
                </Link>
              ) : (
                <button
                  disabled
                  className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed h-full w-full flex items-center justify-center"
                  aria-label="No previous chapter"
                >
                  <Icon icon="mdi:chevron-left" className="text-xl" />
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-primary dark:bg-primary rounded-full transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Next button */}
            <div className="w-8 h-8 flex-shrink-0">
              {navigation.nextChapter ? (
                <Link
                  href={`/novels/${novelId}/c${navigation.nextChapter.chapter_number}`}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-300 h-full w-full flex items-center justify-center"
                  aria-label="Next chapter"
                >
                  <Icon icon="mdi:chevron-right" className="text-xl" />
                </Link>
              ) : (
                <button
                  disabled
                  className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed h-full w-full flex items-center justify-center"
                  aria-label="No next chapter"
                >
                  <Icon icon="mdi:chevron-right" className="text-xl" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Novel Details Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <Link
            href={`/novels/${novelId}`}
            className="block"
            aria-label="View novel details"
          >
            <div className="flex flex-col items-center">
              {/* Novel Cover Image */}
              <div className="relative w-24 h-36 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:opacity-90 transition-opacity mb-2">
                {isValidUrl(novelCoverUrl) ? (
                  <img 
                    src={getProcessedCoverUrl(novelCoverUrl)}
                    alt={novelTitle || "Novel cover"} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", novelCoverUrl);
                      e.currentTarget.src = "https://via.placeholder.com/100?text=No+Cover";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <Icon icon="mdi:book-variant" className="text-4xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-primary/80 rounded-full p-2">
                    <Icon icon="mdi:book-open-variant" className="text-white text-xl" />
                  </div>
                </div>
              </div>
              
              {/* Novel Title */}
              <h3 className="text-sm font-medium text-center text-gray-800 dark:text-gray-200 line-clamp-1 w-full">
                {novelTitle || "View Novel"}
              </h3>
            </div>
          </Link>
        </div>

        {/* Text Customization Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <div className="mb-2 text-center">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-300">
              Text Settings
            </div>
          </div>
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