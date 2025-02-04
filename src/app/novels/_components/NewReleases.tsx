import { Icon } from '@iconify/react';
import Link from 'next/link';
import NovelCover from './NovelCover';
import { useState, useRef } from 'react';

interface NewReleaseNovel {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
}

interface NewReleasesProps {
  recentNovels: NewReleaseNovel[];
}

const NewReleases = ({ recentNovels }: NewReleasesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (recentNovels.length === 0) return null;

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 320;
    const container = scrollContainerRef.current;
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  return (
    <div className="mb-4 mt-6">
      <div className="flex items-center gap-2.5 mb-4 px-4">
        <div className="relative">
          <Icon icon="solar:book-bold" className="text-2xl text-primary" />
          <Icon icon="solar:sparkles-bold-duotone" className="absolute -top-2.5 -right-2.5 text-lg text-yellow-500" />
        </div>
        <h2 className="text-xl font-semibold border-b-2 border-primary pb-1">New Releases</h2>
      </div>

      <div className="relative group px-4">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full -ml-6 transition-all hover:scale-110 ${
            showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <Icon icon="mdi:chevron-left" className="text-3xl" />
        </button>

        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {recentNovels.map(novel => (
            <Link
              key={novel.id}
              href={`/novels/${novel.slug}`}
              className="group/card flex-none w-[160px] flex flex-col p-3 bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden mb-2">
                <NovelCover
                  coverUrl={novel.coverImageUrl || undefined}
                  title={novel.title}
                  isPriority={true}
                />
              </div>
              
              <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover/card:text-primary transition-colors text-center">
                {novel.title}
              </h3>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full -mr-6 transition-all hover:scale-110 ${
            showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <Icon icon="mdi:chevron-right" className="text-3xl" />
        </button>
      </div>
    </div>
  );
};

export default NewReleases; 