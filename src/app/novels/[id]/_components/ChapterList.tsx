import { UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem as ChapterListItemComponent } from './ChapterListItem';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { getChaptersForList, ChapterListItem, ChapterCounts } from '@/services/chapterService';

interface ChapterListProps {
  initialChapters: ChapterListItem[];
  novelId: string;
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  novelAuthorId: string;
  volumes?: Volume[];
}

export const ChapterList = ({
  initialChapters,
  novelId,
  novelSlug,
  userProfile,
  isAuthenticated,
  novelAuthorId,
  volumes = []
}: ChapterListProps) => {
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(volumes[0]?.id || null);
  const [showAllChapters, setShowAllChapters] = useState(true);
  const [showAdvancedChapters, setShowAdvancedChapters] = useState(false);
  const [chapters, setChapters] = useState<ChapterListItem[]>(initialChapters || []);
  const [chapterCounts, setChapterCounts] = useState<ChapterCounts>({ regularCount: 0, advancedCount: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate volume-specific counts for all chapters (both regular and advanced)
  const volumeCounts = useMemo(() => {
    const counts = new Map<string, { total: number, regular: number, advanced: number }>();
    const now = new Date().toISOString();
    
    volumes.forEach(volume => {
      const volumeChapters = initialChapters.filter(ch => ch.volume_id === volume.id);
      
      counts.set(volume.id, {
        total: volumeChapters.length,
        regular: volumeChapters.filter(ch => {
          return !ch.coins || ch.coins === 0 || // Free chapters
                 !ch.publish_at || ch.publish_at <= now; // Published chapters
        }).length,
        advanced: volumeChapters.filter(ch => {
          return ch.publish_at && 
                 ch.publish_at > now && // Future publish date
                 ch.coins > 0;
        }).length
      });
    });
    return counts;
  }, [volumes, initialChapters]);

  const loadChapters = useCallback(async (pageNum: number = 1) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await getChaptersForList({
        novelId,
        page: pageNum,
        userId: userProfile?.id,
        showAdvanced: showAdvancedChapters,
        volumeId: showAllChapters ? null : selectedVolumeId,
        includeAccess: true
      });

      setChapters(result.chapters);
      setChapterCounts(result.counts);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading chapters:', error);
      setError('Failed to load chapters. Please try again.');
      // Keep the previous chapters data on error
    } finally {
      setIsLoading(false);
    }
  }, [novelId, userProfile?.id, showAdvancedChapters, selectedVolumeId, showAllChapters]);

  // Initial load
  useEffect(() => {
    if (!initialChapters || initialChapters.length === 0) {
      loadChapters(1);
    } else {
      // Set initial counts from props
      const now = new Date().toISOString();
      setChapterCounts({
        regularCount: initialChapters.filter(ch => {
          return !ch.coins || ch.coins === 0 || // Free chapters
                 !ch.publish_at || ch.publish_at <= now; // Published chapters
        }).length,
        advancedCount: initialChapters.filter(ch => {
          return ch.publish_at && 
                 ch.publish_at > now && // Future publish date
                 ch.coins > 0;
        }).length,
        total: initialChapters.length
      });
    }
  }, []);

  // Handle volume or advanced chapter toggle
  useEffect(() => {
    let isMounted = true;
    
    const updateChapters = async () => {
      if (!isMounted) return;
      setCurrentPage(1);
      await loadChapters(1);
    };

    updateChapters();

    return () => {
      isMounted = false;
    };
  }, [showAdvancedChapters, selectedVolumeId, showAllChapters, loadChapters]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadChapters(newPage);
      // Scroll to top of the list
      const listElement = document.querySelector('.chapter-list-grid');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage, totalPages, loadChapters]);

  const renderChapter = useCallback((chapter: ChapterListItem) => (
    <div key={chapter.id} className="w-full min-h-[2.5rem] flex items-center px-4 border-b border-border last:border-b-0 md:border-none">
      <div className="w-full">
        <ChapterListItemComponent
          chapter={{
            ...chapter,
            novel_id: novelId,
            content: '',
            created_at: '',
            slug: '',
            author_profile_id: novelAuthorId
          }}
          novelSlug={novelSlug}
          userProfile={userProfile}
          isAuthenticated={isAuthenticated}
          novelAuthorId={novelAuthorId}
          hasTranslatorAccess={chapter.hasTranslatorAccess}
          isUnlocked={chapter.isUnlocked}
        />
      </div>
    </div>
  ), [novelId, novelSlug, userProfile, isAuthenticated, novelAuthorId]);

  const renderPagination = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${currentPage === i
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            }`}
          disabled={isLoading}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 py-4 col-span-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              1
            </button>
            {startPage > 2 && <span className="text-muted-foreground">...</span>}
          </>
        )}
        {pages}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-muted-foreground">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
        </button>
      </div>
    );
  }, [currentPage, totalPages, handlePageChange, isLoading]);

  const selectedVolume = volumes.find(v => v.id === selectedVolumeId);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Chapter Type Selector */}
        <div className="flex items-center p-2 bg-accent/50 border-b border-border overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-full">
            <button
              onClick={() => setShowAdvancedChapters(false)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2
                ${!showAdvancedChapters 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Icon icon="solar:book-linear" className="w-4 h-4" />
              Regular Chapters
              <span className="text-xs">
                ({chapterCounts.regularCount})
              </span>
            </button>
            {chapterCounts.advancedCount > 0 && (
              <button
                onClick={() => setShowAdvancedChapters(true)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2
                  ${showAdvancedChapters 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon icon="solar:crown-linear" className="w-4 h-4" />
                Advanced Chapters
                <span className="text-xs">
                  ({chapterCounts.advancedCount})
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Volume Selector */}
        {volumes.length > 0 && (
          <>
            <div className="flex items-center gap-2 p-2 bg-accent/50 border-b border-border overflow-x-auto scrollbar-hide">
              <button
                onClick={() => {
                  setShowAllChapters(true);
                  setSelectedVolumeId(null);
                }}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${showAllChapters 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                All Chapters
                <span className="ml-2 text-xs">
                  ({chapterCounts.total})
                </span>
              </button>
              {volumes.map(volume => {
                const volumeCount = volumeCounts.get(volume.id) || { total: 0, regular: 0, advanced: 0 };
                return (
                  <button
                    key={volume.id}
                    onClick={() => {
                      setSelectedVolumeId(volume.id);
                      setShowAllChapters(false);
                    }}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${selectedVolumeId === volume.id && !showAllChapters
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Volume {volume.volume_number}{volume.title ? `: ${volume.title}` : ''}
                    <span className="ml-2 text-xs">
                      ({volumeCount.total})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Volume Description */}
            {selectedVolume?.description && !showAllChapters && (
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  {selectedVolume.description}
                </p>
              </div>
            )}
          </>
        )}

        {/* Chapter List */}
        <div className="chapter-list-grid">
          {isLoading ? (
            <div className="col-span-2 py-8">
              <div className="max-w-[200px] mx-auto space-y-4">
                <div className="h-6 bg-accent/50 rounded animate-pulse" />
                <div className="h-6 bg-accent/50 rounded animate-pulse w-3/4" />
                <div className="h-6 bg-accent/50 rounded animate-pulse w-5/6" />
              </div>
            </div>
          ) : error ? (
            <div className="col-span-2 py-8 text-center text-red-500">
              <Icon icon="solar:danger-triangle-linear" className="w-12 h-12 mx-auto mb-2" />
              <p>{error}</p>
              <button
                onClick={() => loadChapters(currentPage)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : chapters.length > 0 ? (
            <>
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 md:divide-x divide-border">
                {chapters.map(renderChapter)}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className="col-span-2 py-8 text-center text-muted-foreground">
              <Icon icon="solar:empty-file-linear" className="w-12 h-12 mx-auto mb-2" />
              <p>No chapters available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 