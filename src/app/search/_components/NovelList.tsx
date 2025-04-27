import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import type { Novel } from '@/types/database';

interface NovelListProps {
  novels: Novel[];
  isLoading?: boolean;
  emptyMessage?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function NovelList({ 
  novels, 
  isLoading,
  emptyMessage = 'No novels found',
  currentPage,
  totalPages,
  onPageChange
}: NovelListProps) {
  if (!isLoading && novels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="space-y-1">
          <div className="text-4xl">📚</div>
          <div>{emptyMessage}</div>
        </div>
      </div>
    );
  }
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the start
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, maxPagesToShow - 1);
      }
      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed at start
      if (start > 2) {
        pages.push('...');
      }

      // Add page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed at end
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always include last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
            Loading novels...
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {novels.map((novel) => (
              <Link
                href={`/novels/${novel.slug}`}
                key={novel.id}
                className="block p-3 bg-secondary rounded-lg border border-border hover:border-primary hover:bg-secondary/80 transition-colors h-full"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="relative w-[100px] h-[140px] rounded-md overflow-hidden">
                      {novel.coverImageUrl ? (
                        <img
                          src={novel.coverImageUrl}
                          alt={`${novel.title} cover`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Icon icon="solar:book-bold" className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium line-clamp-2">{novel.title}</h3>
                    <p className="text-sm text-muted-foreground">by {novel.author}</p>
                    {novel.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {novel.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      {novel.chapterCount} {novel.chapterCount === 1 ? 'chapter' : 'chapters'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 pt-4">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <Icon icon="material-symbols:chevron-left" className="w-5 h-5" />
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                  disabled={page === '...' || isLoading}
                  className={`min-w-[32px] h-8 px-2 rounded-lg ${
                    page === currentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <Icon icon="material-symbols:chevron-right" className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 