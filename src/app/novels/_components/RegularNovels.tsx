'use client';

import { Novel } from '@/types/database';
import NovelCard from './NovelCard';
import { Icon } from '@iconify/react';
import { useEffect } from 'react';

interface RegularNovelsProps {
  novels: Novel[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const RegularNovels = ({
  novels,
  currentPage,
  totalPages,
  onPageChange,
}: RegularNovelsProps) => {
  // Add Google Fonts link via useEffect
  useEffect(() => {
    // Create a link element for Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
    link.rel = 'stylesheet';
    
    // Add it to the document head if it doesn't already exist
    if (!document.head.querySelector('link[href*="Dancing+Script"]')) {
      document.head.appendChild(link);
    }
    
    // No need to clean up as other components may still need it
  }, []);

  if (novels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No novels found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-container rounded-lg mb-2">
        <div className="p-4">
          <h2 
            style={{ fontFamily: "'Dancing Script', cursive" }} 
            className="text-indigo-600 dark:text-indigo-300 font-bold text-2xl mb-4"
          >
            Recently Updated
          </h2>

          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-1.5 sm:gap-x-2">
            {novels.map((novel, index) => (
              <NovelCard 
                key={novel.id} 
                novel={{
                  ...novel,
                  chapters: novel.chapters || []
                }}
                isPriority={index < 6}
                size="small"
                className="mt-1.5 sm:mt-2"
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <Icon icon="mdi:chevron-left" className="text-xl" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <Icon icon="mdi:chevron-right" className="text-xl" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegularNovels; 