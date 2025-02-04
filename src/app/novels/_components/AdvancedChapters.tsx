import { Novel } from '@/types/database';
import Link from 'next/link';
import NovelCover from './NovelCover';
import { Icon } from '@iconify/react';
import { useRef, useState, useEffect } from 'react';

interface AdvancedChaptersProps {
  novels: Novel[];
}

const AdvancedChapters = ({ novels }: AdvancedChaptersProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        scroll('right');
      } else {
        scroll('left');
      }
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  if (novels.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 p-3">
        <Icon icon="mdi:lock" className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold border-b-2 border-primary pb-1">Advanced Chapters</h2>
      </div>

      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full -ml-5 transition-all hover:scale-110 ${
            showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <Icon icon="mdi:chevron-left" className="text-2xl" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full -mr-5 transition-all hover:scale-110 ${
            showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <Icon icon="mdi:chevron-right" className="text-2xl" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2"
        >
          {novels.map(novel => {
            const advancedChapters = novel.chapters?.filter(chapter => {
              const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
              return publishDate && publishDate > new Date() && chapter.coins > 0;
            })
            .sort((a, b) => {
              const dateA = a.publish_at ? new Date(a.publish_at) : new Date();
              const dateB = b.publish_at ? new Date(b.publish_at) : new Date();
              return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 3) || [];
            
            return (
              <Link
                key={novel.id}
                href={`/novels/${novel.slug}`}
                className="group flex-none w-[280px] sm:w-[320px] relative flex gap-3 p-3 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors"
              >
                <div className="w-20 h-28 relative rounded-md overflow-hidden">
                  <NovelCover
                    coverUrl={novel.coverImageUrl}
                    title={novel.title}
                    isPriority={true}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {novel.title}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    {advancedChapters.map(chapter => (
                      <div key={chapter.id} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          Ch.{chapter.chapter_number}
                          {chapter.part_number && `.${chapter.part_number}`}
                        </span>
                        <span className="text-primary">
                          {chapter.publish_at && new Date(chapter.publish_at).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvancedChapters; 