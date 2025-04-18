import { UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem as ChapterListItemComponent } from './ChapterListItem';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { getChaptersForList, ChapterListItem, ChapterCounts } from '@/services/chapterService';
import { useServerTimeContext } from '@/providers/ServerTimeProvider';

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
  const loadingRef = useRef(false);
  // Flag for initial mount
  const isInitialMount = useRef(true);
  const { getServerTime } = useServerTimeContext();
  
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(volumes[0]?.id || null);
  const [showAllChapters, setShowAllChapters] = useState(true);
  const [showAdvancedChapters, setShowAdvancedChapters] = useState(false);
  
  // Filter out draft chapters (negative chapter_number) from initialChapters
  const filteredInitialChapters = useMemo(() => {
    return (initialChapters || []).filter(ch => ch.chapter_number >= 0);
  }, [initialChapters]);
  
  // Initially filter chapters based on showAdvancedChapters
  const filteredChaptersByType = useMemo(() => {
    const serverNow = getServerTime().toISOString();
    
    if (showAdvancedChapters) {
      // Show only advanced chapters (future publish date with coins)
      return filteredInitialChapters.filter(ch => {
        const isAdvanced = ch.publish_at && 
                         ch.publish_at > serverNow && // Future publish date
                         ch.coins > 0;
        const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
        return isAdvanced && !isAccessible;
      });
    } else {
      // Show only regular chapters
      return filteredInitialChapters.filter(ch => {
        const isAdvanced = ch.publish_at && 
                         ch.publish_at > serverNow && // Future publish date
                         ch.coins > 0;
        const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
        return !isAdvanced || isAccessible;
      });
    }
  }, [filteredInitialChapters, showAdvancedChapters, getServerTime]);
  
  const [chapters, setChapters] = useState<ChapterListItem[]>(filteredChaptersByType);
  const [chapterCounts, setChapterCounts] = useState<ChapterCounts>({ regularCount: 0, advancedCount: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeCounts, setVolumeCounts] = useState(new Map<string, { total: number; regular: number; advanced: number }>());

  // Calculate volume-specific counts only once on initial render or when volumes/initialChapters change
  useEffect(() => {
    const counts = new Map<string, { total: number; regular: number; advanced: number }>();
    
    volumes.forEach(volume => {
      const volumeChapters = filteredInitialChapters.filter(ch => ch.volume_id === volume.id);
      const serverNow = getServerTime().toISOString();
      
      counts.set(volume.id, {
        total: volumeChapters.length,
        regular: volumeChapters.filter(ch => {
          return !ch.coins || 
                 ch.coins === 0 || // Free chapters
                 !ch.publish_at || 
                 ch.publish_at <= serverNow || // Published chapters
                 ch.isUnlocked || // Unlocked chapters
                 ch.hasTranslatorAccess; // Translator access
        }).length,
        advanced: volumeChapters.filter(ch => {
          const isAdvanced = ch.publish_at && 
                           ch.publish_at > serverNow && // Future publish date
                           ch.coins > 0;
          const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
          return isAdvanced && !isAccessible;
        }).length
      });
    });

    setVolumeCounts(counts);
  }, [volumes, filteredInitialChapters, getServerTime]);

  // Sort function that puts extra chapters last - memoized with no dependencies
  const sortChapters = useCallback((a: ChapterListItem, b: ChapterListItem) => {
    // If one is an extra chapter and the other isn't, sort extra chapter last
    if (a.part_number === -1 && b.part_number !== -1) return 1;
    if (a.part_number !== -1 && b.part_number === -1) return -1;
    
    // If both are extra chapters or both are regular chapters, sort by chapter number
    if (a.chapter_number !== b.chapter_number) {
      return a.chapter_number - b.chapter_number;
    }
    
    // If chapter numbers are equal and neither is an extra chapter, sort by part number
    if (a.part_number !== -1 && b.part_number !== -1) {
      const partA = a.part_number ?? 0;
      const partB = b.part_number ?? 0;
      return partA - partB;
    }
    
    return 0;
  }, []);

  // Create a stable fetchChapters function that doesn't change on re-renders
  // This is the core function that makes API calls but doesn't update state
  const fetchChapters = useCallback(async (
    page: number,
    showAdvanced: boolean,
    allChapters: boolean,
    volumeId: string | null
  ) => {
    return await getChaptersForList({
      novelId,
      page,
      userId: userProfile?.id,
      showAdvanced,
      volumeId: allChapters ? null : volumeId,
      includeAccess: true
    });
  }, [novelId, userProfile?.id]);

  // Function to load chapters and update state
  // Separated from fetchChapters to avoid circular dependencies
  const loadChapters = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchChapters(
        pageNum,
        showAdvancedChapters,
        showAllChapters,
        selectedVolumeId
      );

      setChapters(result.chapters);
      setChapterCounts(result.counts);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading chapters:', error);
      setError('Failed to load chapters. Please try again.');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [fetchChapters, showAdvancedChapters, showAllChapters, selectedVolumeId]);

  // Initial load effect - only runs once after mount
  useEffect(() => {
    // Only run this effect once
    if (!isInitialMount.current) return;
    
    // If we have initial chapters, set up initial counts
    if (filteredInitialChapters && filteredInitialChapters.length > 0) {
      const serverNow = getServerTime().toISOString();
      setChapterCounts({
        regularCount: filteredInitialChapters.filter(ch => {
          return !ch.coins || 
                 ch.coins === 0 || // Free chapters
                 !ch.publish_at || 
                 ch.publish_at <= serverNow || // Published chapters
                 ch.isUnlocked || // Unlocked chapters
                 ch.hasTranslatorAccess; // Translator access
        }).length,
        advancedCount: filteredInitialChapters.filter(ch => {
          const isAdvanced = ch.publish_at && 
                           ch.publish_at > serverNow && // Future publish date
                           ch.coins > 0;
          const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
          return isAdvanced && !isAccessible;
        }).length,
        total: filteredInitialChapters.length
      });
    } else {
      // If no initial chapters, load them
      loadChapters(1);
    }
    
    // Mark initial mount complete
    isInitialMount.current = false;
  }, [filteredInitialChapters, loadChapters, getServerTime]);

  // Effect to handle filter changes (volume, advanced toggle)
  // This uses refs to track previous values to avoid unnecessary updates
  const prevFiltersRef = useRef({
    showAdvancedChapters,
    selectedVolumeId,
    showAllChapters
  });
  
  useEffect(() => {
    // Skip on first mount - that's handled by the initial load effect
    if (isInitialMount.current) return;
    
    const prevFilters = prevFiltersRef.current;
    
    // Only update if filters actually changed
    if (
      prevFilters.showAdvancedChapters !== showAdvancedChapters ||
      prevFilters.selectedVolumeId !== selectedVolumeId ||
      prevFilters.showAllChapters !== showAllChapters
    ) {
      // Reset to page 1 when filters change
      setCurrentPage(1);
      loadChapters(1);
      
      // Update ref with current values
      prevFiltersRef.current = {
        showAdvancedChapters,
        selectedVolumeId,
        showAllChapters
      };
    }
  }, [showAdvancedChapters, selectedVolumeId, showAllChapters, loadChapters]);

  // Update chapters when showAdvancedChapters changes and we're using initialChapters
  useEffect(() => {
    // When we're using the initial chapters directly, we need to filter them
    // This handles the case where the API hasn't been called yet
    if (isInitialMount.current || loadingRef.current) return;
    
    setChapters(filteredChaptersByType);
  }, [filteredChaptersByType]);

  // Effect to handle page changes
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    // Skip on first mount - that's handled by the initial load effect
    if (isInitialMount.current) return;
    
    // Only load if page actually changed and it wasn't changed by a filter toggle
    if (prevPageRef.current !== currentPage) {
      loadChapters(currentPage);
      prevPageRef.current = currentPage;
    }
  }, [currentPage, loadChapters]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      // Scroll to top of the list
      const listElement = document.querySelector('.chapter-list-grid');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage, totalPages]);

  const isChapterPublished = useCallback((chapter: ChapterListItem): boolean => {
    // A chapter is considered "published" if:
    // 1. It has no publish date OR
    // 2. Its publish date has passed (using server time) OR
    // 3. It's free (no coins) OR
    // 4. It's been unlocked by the user OR
    // 5. User has translator access
    return !chapter.publish_at || 
           new Date(chapter.publish_at) <= getServerTime() ||
           !chapter.coins ||
           chapter.coins === 0 ||
           !!chapter.isUnlocked ||
           !!chapter.hasTranslatorAccess;
  }, [getServerTime]);

  const renderChapter = useCallback((chapter: ChapterListItem) => (
    chapter.chapter_number >= 0 && (
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
            isPublished={isChapterPublished(chapter)}
          />
        </div>
      </div>
    )
  ), [novelId, novelSlug, userProfile, isAuthenticated, novelAuthorId, isChapterPublished]);

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

  const chaptersGroupedByVolume = useMemo(() => {
    // Always filter out draft chapters (negative chapter_number)
    const visibleChapters = chapters.filter(ch => ch.chapter_number >= 0);
    const noVolumeChapters = visibleChapters.filter(chapter => !chapter.volume_id);
    const volumeChapters = new Map<string, ChapterListItem[]>();
    
    volumes.forEach(volume => {
      volumeChapters.set(volume.id, visibleChapters.filter(chapter => chapter.volume_id === volume.id));
    });

    // Sort chapters in each volume
    volumeChapters.forEach((chapters, volumeId) => {
      volumeChapters.set(volumeId, [...chapters].sort(sortChapters));
    });

    // Sort no volume chapters
    const sortedNoVolumeChapters = [...noVolumeChapters].sort(sortChapters);

    return {
      noVolumeChapters: sortedNoVolumeChapters,
      volumeChapters
    };
  }, [chapters, volumes, sortChapters]);

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
                {(selectedVolumeId && !showAllChapters
                  ? chaptersGroupedByVolume.volumeChapters.get(selectedVolumeId)?.map(renderChapter)
                  : [...chaptersGroupedByVolume.noVolumeChapters,
                      ...Array.from(chaptersGroupedByVolume.volumeChapters.values()).flat()
                    ].sort(sortChapters).map(renderChapter)
                )}
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