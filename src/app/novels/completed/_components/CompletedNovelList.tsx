'use client';

import { Novel } from '@/types/database';
import NovelCard from '../../_components/NovelCard';
import Pagination from '@/components/Pagination';
import { useEffect, useState } from 'react';
import { getTotalChaptersForNovels } from '@/services/chapterService';
import { Icon } from '@iconify/react';

interface CompletedNovelListProps {
  novels: Novel[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CompletedNovelList = ({
  novels,
  currentPage,
  totalPages,
  onPageChange,
}: CompletedNovelListProps) => {
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});

  // Batch fetch counts for completed novels
  useEffect(() => {
    const fetchCounts = async () => {
      const ids = novels.map((n) => n.id);
      const counts = await getTotalChaptersForNovels(ids);
      setChapterCounts(counts);
    };

    if (novels.length) {
      fetchCounts();
    }
  }, [novels]);

  // Add Google Fonts link via useEffect
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
    link.rel = 'stylesheet';
    
    if (!document.head.querySelector('link[href*="Dancing+Script"]')) {
      document.head.appendChild(link);
    }
    
  }, []);

  return (
    <div>
      <h1 
        style={{ fontFamily: "'Dancing Script', cursive" }} 
        className="text-indigo-600 dark:text-indigo-300 font-bold text-center text-4xl border-b border-border pb-2 mb-2"
      >
        ✿ Completed ✿
      </h1>
      
      {novels.length === 0 ? (
        <div className="text-center text-gray-500 py-2">
          No completed novels found.
        </div>
      ) : (
        <>
          {Object.keys(chapterCounts).length !== novels.length ? (
            <div className="flex justify-center py-6">
              <Icon icon="mdi:loading" className="animate-spin text-3xl text-primary/60" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {novels.map((novel) => (
                <NovelCard
                  key={novel.id}
                  novel={novel}
                  chapterCount={chapterCounts[novel.id]}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompletedNovelList; 