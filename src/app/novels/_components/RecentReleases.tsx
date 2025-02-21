import Link from 'next/link';
import NovelCover from './NovelCover';
import { useRef } from 'react';

interface NewReleaseNovel {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  chapters?: {
    chapter_number: number;
    part_number?: number | null;
    publish_at: string;
  }[];
}

interface NewReleasesProps {
  recentNovels: NewReleaseNovel[];
}

const NewReleases = ({ recentNovels }: NewReleasesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (recentNovels.length === 0) return null;

  return (
    <div className="mb-4 mt-6">
      <div className="flex items-center gap-2.5 mb-4 px-4">
        <h2 className="text-xl font-semibold border-b-2 border-primary pb-1">Recent Releases</h2>
      </div>

      <div className="px-4">
        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-track]:bg-accent/30 [&::-webkit-scrollbar-track]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
        >
          {recentNovels.map(novel => {
            const latestChapter = novel.chapters?.[0];
            
            return (
              <Link
                key={novel.id}
                href={`/novels/${novel.slug}`}
                className="group/card flex-none w-[100px] sm:w-[130px] flex flex-col p-1.5 sm:p-2 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="w-full aspect-[2/3] relative rounded-sm overflow-hidden mb-1.5">
                  <NovelCover
                    coverUrl={novel.coverImageUrl || undefined}
                    title={novel.title}
                    isPriority={true}
                  />
                </div>
                
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 group-hover/card:text-primary transition-colors text-center">
                  {novel.title}
                </h3>
                
                {latestChapter && (
                  <div className="mt-0.5 text-[10px] sm:text-xs text-center text-muted-foreground">
                    Ch.{latestChapter.chapter_number}
                    {latestChapter.part_number && `.${latestChapter.part_number}`}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NewReleases; 