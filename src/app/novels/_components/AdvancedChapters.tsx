import Link from 'next/link';
import { Icon } from '@iconify/react';
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
  const ITEMS_PER_PAGE = 8;

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

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {novels.map(novel => (
            <div
              key={novel.id}
              className="flex gap-3 rounded-lg bg-container transition-shadow hover:shadow-md min-h-0"
              draggable={false}
            >
              {/* Cover */}
              <Link href={`/novels/${novel.slug}`} className="relative w-20 sm:w-24 self-stretch flex-shrink-0 block">
                <NovelCover
                  coverUrl={novel.coverImageUrl}
                  title={novel.title}
                  size="thumbnail"
                  fitParent
                />
              </Link>

              {/* Details */}
              <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <Link href={`/novels/${novel.slug}`} className="hover:text-primary transition-colors">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                    {novel.title}
                  </h3>
                </Link>

                <ul className="mt-2 space-y-1">
                  {novel.chapters?.slice(0, 4).map((chapter, index) => (
                    <li
                      key={index}
                      className="text-xs sm:text-sm"
                    >
                      <Link 
                        href={`/novels/${novel.slug}/c${chapter.chapter_number}${chapter.part_number ? `-p${chapter.part_number}` : ''}`}
                        className="flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                      >
                        <Icon icon="ph:lock" className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Ch.{chapter.chapter_number}{chapter.part_number && `.${chapter.part_number}`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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