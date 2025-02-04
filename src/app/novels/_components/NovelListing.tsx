'use client';

import { Novel } from '@/types/database';
import { useEffect, useState, useMemo } from 'react';
import { getNovels } from '@/services/novelService';
import NovelCard from './NovelCard';
import LoadingGrid from './LoadingGrid';
import AdvancedChapters from './AdvancedChapters';
import NewReleases from './NewReleases';
import { Icon } from '@iconify/react';
import FeaturedNovel from './FeaturedNovel';

const NovelListing = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [totalNovels, setTotalNovels] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [recentAdvancedNovels, setRecentAdvancedNovels] = useState<Novel[]>([]);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const { novels: data, total } = await getNovels({
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE
        });
        
        setNovels(data);
        setTotalNovels(total);
        
        // Only set featured novels on first page load
        if (currentPage === 1) {
          // Sort novels by view count and get top 5
          const mostViewed = [...data]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
          
          setFeaturedNovels(mostViewed);
        }
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, [currentPage]);

  // Separate effect for fetching recent novels with advanced chapters
  useEffect(() => {
    const fetchRecentAdvanced = async () => {
      try {
        const { novels: allNovels } = await getNovels({ limit: 100, offset: 0 });
        
        // Filter novels with advanced chapters and sort by most recent
        const novelsWithAdvanced = allNovels
          .filter(novel => 
            novel.chapters?.some(chapter => {
              const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
              return publishDate && publishDate > new Date() && chapter.coins > 0;
            })
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        setRecentAdvancedNovels(novelsWithAdvanced);
      } catch (error) {
        console.error('Error fetching recent advanced novels:', error);
      }
    };

    fetchRecentAdvanced();
  }, []);

  const advancedNovels = useMemo(() => {
    return novels.filter(novel => 
      novel.chapters?.some(chapter => {
        const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
        return publishDate && publishDate > new Date() && chapter.coins > 0;
      })
    );
  }, [novels]);

  const totalPages = Math.ceil(totalNovels / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the grid
    document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg mb-6"></div>
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 -mt-4 sm:-mt-8">
      {/* Featured Novels */}
      {featuredNovels.length > 0 && (
        <div className="relative pt-4 sm:pt-0">
          <FeaturedNovel novels={featuredNovels} />
        </div>
      )}

      <NewReleases
        recentNovels={recentAdvancedNovels.map(novel => ({
          id: novel.id,
          slug: novel.slug,
          title: novel.title,
          coverImageUrl: novel.coverImageUrl || null,
          chaptersCount: novel.chapters?.length || 0,
          status: novel.status,
          created_at: new Date(novel.created_at)
        }))}
      />
      
      {novels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No novels found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-2 pb-8">
            {novels.map((novel, index) => (
              <NovelCard 
                key={novel.id} 
                novel={novel}
                isPriority={index < 6}
                size="small"
                className="mt-6"
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 mb-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(pageNumber)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <Icon icon="mdi:chevron-right" className="text-xl" />
              </button>
            </div>
          )}

          <AdvancedChapters
            novels={advancedNovels}
          />
        </>
      )}
    </div>
  );
};

export default NovelListing; 