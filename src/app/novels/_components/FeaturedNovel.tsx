'use client';

import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface FeaturedNovelProps {
  novels: Novel[];
}

const FeaturedNovel = ({ novels }: FeaturedNovelProps) => {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoRotationPaused, setIsAutoRotationPaused] = useState(false);
  const [fading, setFading] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  // Squiggly clip-path for mobile card edges
  const mobileClip = 'polygon(0 0,100% 0,100% 5%,98% 8%,100% 11%,98% 14%,100% 17%,98% 20%,100% 23%,98% 26%,100% 29%,98% 32%,100% 35%,98% 38%,100% 41%,98% 44%,100% 47%,98% 50%,100% 53%,98% 56%,100% 59%,98% 62%,100% 65%,98% 68%,100% 71%,98% 74%,100% 77%,98% 80%,100% 83%,98% 86%,100% 89%,98% 92%,100% 95%,100% 100%,0 100%,0 95%,2% 92%,0 89%,2% 86%,0 83%,2% 80%,0 77%,2% 74%,0 71%,2% 68%,0 65%,2% 62%,0 59%,2% 56%,0 53%,2% 50%,0 47%,2% 44%,0 41%,2% 38%,0 35%,2% 32%,0 29%,2% 26%,0 23%,2% 20%,0 17%,2% 14%,0 11%,2% 8%,0 5%)';

  useEffect(() => {
    // Auto-rotate featured novels every 5 seconds (mobile-only)
    if (!isDesktop) {
      const interval = setInterval(() => {
        if (!isAutoRotationPaused && novels.length > 0) {
          setFeaturedIndex(prev => prev === novels.length - 1 ? 0 : prev + 1);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [novels.length, isAutoRotationPaused, isDesktop]);

  // Reset auto-rotation after 10 seconds of no interaction
  useEffect(() => {
    if (isAutoRotationPaused) {
      const timeout = setTimeout(() => {
        setIsAutoRotationPaused(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isAutoRotationPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsAutoRotationPaused(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setFeaturedIndex(prev => 
        prev === novels.length - 1 ? 0 : prev + 1
      );
    }
    if (isRightSwipe) {
      setFeaturedIndex(prev => 
        prev === 0 ? novels.length - 1 : prev - 1
      );
    }
  };

  // Desktop auto-rotation every 6s
  useEffect(() => {
    if (isDesktop && novels.length > 0) {
      const interval = setInterval(() => {
        setFading(true);
        setTimeout(() => {
          setFeaturedIndex(prev => (prev + 3) % novels.length);
          setFading(false);
        }, 300); // fade duration
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isDesktop, novels.length]);

  if (novels.length === 0) return null;

  // Desktop view: show first 3 novels side by side
  if (isDesktop) {
    // Get 3 novels starting from featuredIndex in a circular manner
    const displayNovels = Array.from({ length: Math.min(3, novels.length) }, (_, i) => {
      return novels[(featuredIndex + i) % novels.length];
    });

    return (
      <div className="relative">
        {/* Carousel Grid */}
        <div
          className="grid grid-cols-3 gap-4 transition-opacity duration-300"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {displayNovels.map((novel, idx) => {
            // Apply wavy polygon clip-path for side cards
            let clip = '';
            if (idx === 0) {
              clip = 'polygon(0 0,100% 0,100% 100%,0 100%,3% 90%,0 80%,3% 70%,0 60%,3% 50%,0 40%,3% 30%,0 20%,3% 10%)';
            } else if (idx === 2) {
              clip = 'polygon(0 0,100% 0,100% 5%,97% 10%,100% 15%,97% 20%,100% 25%,97% 30%,100% 35%,97% 40%,100% 45%,97% 50%,100% 55%,97% 60%,100% 65%,97% 70%,100% 75%,97% 80%,100% 85%,97% 90%,100% 95%,100% 100%,0 100%)';
            }
            const styleObj: React.CSSProperties = {
              backgroundImage: `url(${novel.coverImageUrl})`,
              clipPath: clip || undefined,
            };

            return (
              <Link
                key={novel.id}
                href={`/novels/${novel.slug}`}
                className="group relative flex flex-row gap-4 p-2 rounded-lg transition-colors overflow-hidden aspect-[3/2] bg-cover bg-center"
                style={styleObj}
              >
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative z-10 flex flex-col h-full w-full px-2">
                  <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1">
                    {novel.title}
                  </h3>

                  {novel.tags?.length ? (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {novel.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-md"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <button
                    className="inline-flex items-center gap-1 px-4 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-full mt-auto w-max"
                    aria-label="Read now"
                  >
                    Read now
                    <Icon icon="mdi:arrow-right" className="text-base" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Auto-rotation indicator could be added if desired */}
      </div>
    );
  }

  return (
    <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-3 flex flex-col">
      <Link
        href={`/novels/${novels[featuredIndex].slug}`}
        className={`group relative flex flex-row gap-4 p-2 sm:p-2 hover:bg-accent/20 rounded-lg transition-colors touch-pan-y overflow-hidden aspect-[3/2] sm:aspect-auto min-h-[120px] sm:min-h-[200px] bg-cover bg-center`}
        style={{ backgroundImage: `url(${novels[featuredIndex].coverImageUrl})`, clipPath: mobileClip }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (touchStart && touchEnd && Math.abs(touchStart - touchEnd) > minSwipeDistance) {
            e.preventDefault();
          }
        }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-row gap-4 w-full items-start">
          <div className="flex-1 min-w-0 flex flex-col h-full px-2 sm:px-4">
            <h3 className="text-2xl sm:text-3xl font-semibold text-white transition-colors mb-2 sm:mb-1 line-clamp-2 sm:line-clamp-1">
              {novels[featuredIndex].title}
            </h3>

            {/* Tags */}
            {novels[featuredIndex].tags?.length ? (
              <div className="flex flex-wrap gap-1 mb-3">
                {novels[featuredIndex].tags.slice(0, 3).map(tag => (
                  <span
                    key={tag.id}
                    className="bg-white/20 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 rounded-full backdrop-blur-md"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Read Now Button */}
            <div className="flex justify-start mt-auto">
              <button
                className="inline-flex items-center gap-2 px-5 py-2 sm:px-4 sm:py-1 bg-red-600 hover:bg-red-700 text-white text-base sm:text-sm rounded-full transition-colors"
                aria-label="Read now"
              >
                Read now
                <Icon icon="mdi:arrow-right" className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default FeaturedNovel;