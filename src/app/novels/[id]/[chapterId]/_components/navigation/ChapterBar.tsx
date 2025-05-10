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
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
  isCommentOpen: boolean;
  novelCoverUrl?: string;
  novelTitle?: string;
  hideComments: boolean;
  onHideCommentsChange: (hide: boolean) => void;
  settingsButtonRef?: React.RefObject<HTMLButtonElement>;
  floatingDesktopModal?: boolean;
}

export default function ChapterProgressBar({
  novelId,
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
  isCommentOpen,
  novelCoverUrl,
  novelTitle,
  hideComments,
  onHideCommentsChange,
  settingsButtonRef,
  floatingDesktopModal = false,
}: ChapterProgressBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const barRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);
  const [desktopTop, setDesktopTop] = useState<string | number>('4.5rem');

  // Handle clicks outside the bar
  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setIsVisible(false);
        // Notify other components that ChapterBar is closed
        const customEvent = new CustomEvent('toggleChapterBar', {
          detail: { isVisible: false }
        });
        document.dispatchEvent(customEvent);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isVisible]);

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

  // Desktop modal alignment
  useEffect(() => {
    if (floatingDesktopModal && settingsButtonRef && settingsButtonRef.current && !isMobile) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setDesktopTop(rect.top + window.scrollY + 'px');
    }
  }, [floatingDesktopModal, settingsButtonRef, isMobile, isVisible]);

  if (floatingDesktopModal && !isMobile) {
    return (
      <div
        ref={barRef}
        className={`fixed right-4 z-[100] transition-all duration-300 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ top: desktopTop }}
      >
        <div className="flex justify-between items-center mb-2 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Reading Settings</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Close settings"
            aria-label="Close settings"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>
        <div className="p-4">
          <TextCustomization
            onFontChange={onFontChange}
            onSizeChange={onSizeChange}
            currentFont={currentFont}
            currentSize={currentSize}
          />
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Icon icon="mdi:comment-outline" className="w-4 h-4" />
                <span>Comments</span>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHideCommentsChange(!hideComments);
                }}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                  hideComments ? 'bg-gray-300 dark:bg-gray-700' : 'bg-primary'
                }`}
                aria-label="Toggle comment icons"
              >
                <span 
                  className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${
                    hideComments ? 'translate-x-1.5' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isMobile) return null;

  return (
    <div
      ref={barRef}
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
          onClick={() => {
            setIsVisible(false);
            // Notify other components that ChapterBar is closed
            const event = new CustomEvent('toggleChapterBar', {
              detail: { isVisible: false }
            });
            document.dispatchEvent(event);
          }}
          className="absolute top-3 right-3 text-gray-500 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="Close chapter options"
        >
          <Icon icon="mdi:close" className="text-lg" />
        </button>

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
          
          {/* Comment Icons Toggle */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <Icon icon="mdi:comment-outline" className="w-4 h-4" />
                <span>Comments</span>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHideCommentsChange(!hideComments);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                  hideComments ? 'bg-gray-300 dark:bg-gray-700' : 'bg-primary'
                }`}
                aria-label="Toggle comment icons"
              >
                <span 
                  className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${
                    hideComments ? 'translate-x-1.5' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}