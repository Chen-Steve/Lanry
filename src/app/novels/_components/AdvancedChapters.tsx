import Link from 'next/link';
import { Novel } from '@/types/database';
import { useState } from 'react';
import { getNovelsWithAdvancedChapters } from '@/services/novelService';
import NovelCover from './NovelCover';

interface AdvancedChaptersProps {
  initialNovels: Novel[];
  initialTotal: number;
}

const AdvancedChapters = ({ initialNovels, initialTotal }: AdvancedChaptersProps) => {
  const [novels, setNovels] = useState<Novel[]>(initialNovels);
  const [total, setTotal] = useState<number>(initialTotal);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const loadMore = async () => {
    try {
      setIsLoading(true);
      const nextPage = page + 1;
      const { novels: newNovels, total: newTotal } = await getNovelsWithAdvancedChapters(nextPage, ITEMS_PER_PAGE);
      if (newNovels.length > 0) {
        setNovels(prev => [...prev, ...newNovels]);
        setTotal(newTotal);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more novels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!novels?.length) return null;

  const hasMore = total > novels.length;
  

  return (
    <div className="mb-2">
      <div className="bg-container rounded-lg p-4">
        <div className="flex items-start mb-4">
          <h2 
            style={{ fontFamily: "'Dancing Script', cursive" }} 
            className="text-indigo-600 dark:text-indigo-300 font-bold text-2xl"
          >
            Advanced Chapters
          </h2>
        </div>

        <div className="divide-y divide-border">
          {novels.map(novel => (
            <Link
              key={novel.id}
              href={`/novels/${novel.slug}`}
              className="group block mb-2 py-1 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-12 h-16 flex-shrink-0">
                  <NovelCover
                    coverUrl={novel.coverImageUrl}
                    title={novel.title}
                    size="thumbnail"
                  />
                </div>
                <div className="flex-grow pt-0">
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {novel.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-x-4">
                    {novel.chapters?.map((chapter, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
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
                    {novel.chapters?.length === 5 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">. . .</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedChapters; 