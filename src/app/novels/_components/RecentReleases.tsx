import Link from 'next/link';
import NovelCover from './NovelCover';
import { useRef } from 'react';

interface NewReleaseNovel {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
}

interface NewReleasesProps {
  recentNovels: NewReleaseNovel[];
  className?: string;
}

const NewReleases = ({ recentNovels, className = '' }: NewReleasesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (recentNovels.length === 0) return null;

  return (
    <div className={`mt-2 w-full max-w-[95%] mx-auto ${className}`}>
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold border-b-2 border-primary">Recent Releases</h2>
      </div>

      <div>
        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
        >
          {recentNovels.map(novel => (
              <Link
                key={novel.id}
                href={`/novels/${novel.slug}`}
                className="group/card flex-none w-[120px] sm:w-[160px] flex flex-col p-1.5 sm:p-2 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="w-full aspect-[2/3] relative rounded-sm overflow-hidden mb-1.5">
                  <NovelCover
                    coverUrl={novel.coverImageUrl || undefined}
                    title={novel.title}
                  />
                </div>
                
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 group-hover/card:text-primary transition-colors text-center">
                  {novel.title}
                </h3>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NewReleases; 