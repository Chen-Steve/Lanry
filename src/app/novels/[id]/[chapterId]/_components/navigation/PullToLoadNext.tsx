'use client';

import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

interface PullToLoadNextProps {
  nextChapter: {
    chapter_number: number;
    part_number?: number | null;
  } | null;
  novelId: string;
  isLoading?: boolean;
}

export default function PullToLoadNext({ nextChapter, novelId, isLoading = false }: PullToLoadNextProps) {
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 100; // The amount of pixels to pull before triggering

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pulling if we're at the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      if (!isAtBottom) return;

      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || !nextChapter) return;

      const currentY = e.touches[0].clientY;
      const diff = touchStartY.current - currentY;
      const progress = Math.max(0, Math.min(100, (diff / threshold) * 100));
      setPullProgress(progress);

      // Prevent default scrolling while pulling
      if (progress > 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling || !nextChapter) return;

      if (pullProgress >= 100) {
        // Navigate to next chapter
        const partSuffix = nextChapter.part_number ? `-p${nextChapter.part_number}` : '';
        router.push(`/novels/${novelId}/c${nextChapter.chapter_number}${partSuffix}`);
      }

      setIsPulling(false);
      setPullProgress(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, nextChapter, novelId, pullProgress, router]);

  if (!nextChapter) return null;

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center py-8 text-muted-foreground border-t-2 border-black border-dashed mt-4"
    >
      <div className="relative w-8 h-8 mb-2">
        {isLoading ? (
          <Icon 
            icon="eos-icons:loading" 
            className="w-8 h-8 animate-spin"
          />
        ) : isPulling && pullProgress > 0 ? (
          <Icon 
            icon="eos-icons:loading" 
            className="w-8 h-8 animate-spin"
            style={{
              opacity: Math.min(0.5 + pullProgress / 100, 1)
            }}
          />
        ) : (
          <Icon 
            icon="mdi:chevron-up" 
            className="w-8 h-8 animate-bounce"
          />
        )}
      </div>
      <div className="text-sm flex flex-col items-center gap-1">
        {isLoading ? (
          <span>Loading next chapter...</span>
        ) : isPulling ? (
          <span>{pullProgress >= 100 ? 'Release to load next chapter' : 'Pull up to load next chapter'}</span>
        ) : (
          <>
            <span>Scroll up here and release</span>
            <span className="text-xs opacity-75">to next chapter</span>
          </>
        )}
      </div>
    </div>
  );
} 