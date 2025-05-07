import { UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem as ChapterListItemComponent } from './ChapterListItem';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { getChaptersForList, ChapterListItem, ChapterCounts } from '@/services/chapterService';
import { useServerTimeContext } from '@/providers/ServerTimeProvider';
import { BulkPurchaseModal } from './BulkPurchaseModal';

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
  const isInitialMount = useRef(true);
  const volumeDropdownRef = useRef<HTMLDivElement>(null);
  const chapterTypeDropdownRef = useRef<HTMLDivElement>(null);
  const { getServerTime } = useServerTimeContext();
  
  type ChapterTypeFilter = 'all' | 'regular' | 'advanced';
  
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [chapterTypeFilter, setChapterTypeFilter] = useState<ChapterTypeFilter>('all');
  const [showVolumeDescription, setShowVolumeDescription] = useState(false);
  const [showChapterTypeDropdown, setShowChapterTypeDropdown] = useState(false);
  
  // Utility to check if a chapter is locked indefinitely (50+ years in the future)
  const isIndefinitelyLocked = useCallback((ch: ChapterListItem): boolean => {
    if (!ch.publish_at) return false;
    const publishDate = new Date(ch.publish_at);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    return publishDate > fiftyYearsFromNow;
  }, []);
  
  // Filter out draft chapters (negative chapter_number) from initialChapters
  const filteredInitialChapters = useMemo(() => {
    return (initialChapters || []).filter(ch => ch.chapter_number >= 0);
  }, [initialChapters]);
  
  // Apply filters based on chapterTypeFilter
  const filteredChaptersByType = useMemo(() => {
    const serverNow = getServerTime().toISOString();
    
    if (chapterTypeFilter === 'advanced') {
      // Show only advanced chapters (future publish date with coins)
      return filteredInitialChapters.filter(ch => {
        // Check if chapter is indefinitely locked
        if (isIndefinitelyLocked(ch)) return true;
        
        const isAdvanced = ch.publish_at && 
                         ch.publish_at > serverNow && // Future publish date
                         (ch.coins ?? 0) > 0;
        const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
        return isAdvanced && !isAccessible;
      });
    } else if (chapterTypeFilter === 'regular') {
      // Show only regular chapters (free or published)
      return filteredInitialChapters.filter(ch => {
        // Don't show indefinitely locked chapters in regular view
        if (isIndefinitelyLocked(ch)) return false;
        
        const isAdvanced = ch.publish_at && 
                         ch.publish_at > serverNow && // Future publish date
                         (ch.coins ?? 0) > 0;
        const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
        return !isAdvanced || isAccessible;
      });
    } else {
      // Show all chapters
      return filteredInitialChapters;
    }
  }, [filteredInitialChapters, chapterTypeFilter, getServerTime, isIndefinitelyLocked]);
  
  const [chapters, setChapters] = useState<ChapterListItem[]>(filteredChaptersByType);
  const [chapterCounts, setChapterCounts] = useState<ChapterCounts>({ regularCount: 0, advancedCount: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeCounts, setVolumeCounts] = useState(new Map<string, { total: number; regular: number; advanced: number }>());
  const [isBulkPurchaseModalOpen, setIsBulkPurchaseModalOpen] = useState(false);
  
  // Calculate volume-specific counts
  useEffect(() => {
    const counts = new Map<string, { total: number; regular: number; advanced: number }>();
    
    // Add an "All Volumes" entry
    counts.set('all', {
      total: filteredInitialChapters.length,
      regular: 0,
      advanced: 0
    });
    
    volumes.forEach(volume => {
      const volumeChapters = filteredInitialChapters.filter(ch => ch.volume_id === volume.id);
      const serverNow = getServerTime().toISOString();
      
      counts.set(volume.id, {
        total: volumeChapters.length,
        regular: volumeChapters.filter(ch => {
          // Don't count indefinitely locked chapters as regular
          if (isIndefinitelyLocked(ch)) return false;
          
          return !ch.coins || 
                 ch.coins === 0 || // Free chapters
                 !ch.publish_at || 
                 ch.publish_at <= serverNow || // Published chapters
                 ch.isUnlocked || // Unlocked chapters
                 ch.hasTranslatorAccess; // Translator access
        }).length,
        advanced: volumeChapters.filter(ch => {
          // Count indefinitely locked chapters as advanced
          if (isIndefinitelyLocked(ch)) return true;
          
          const isAdvanced = ch.publish_at && 
                           ch.publish_at > serverNow && // Future publish date
                           (ch.coins ?? 0) > 0;
          const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
          return isAdvanced && !isAccessible;
        }).length
      });
    });

    // Update the "All Volumes" entry with calculated counts
    const allVolumes = counts.get('all');
    if (allVolumes) {
      const serverNow = getServerTime().toISOString();
      counts.set('all', {
        ...allVolumes,
        regular: filteredInitialChapters.filter(ch => {
          // Don't count indefinitely locked chapters as regular
          if (isIndefinitelyLocked(ch)) return false;
          
          return !ch.coins || 
                 ch.coins === 0 || // Free chapters
                 !ch.publish_at || 
                 ch.publish_at <= serverNow || // Published chapters
                 ch.isUnlocked || // Unlocked chapters
                 ch.hasTranslatorAccess; // Translator access
        }).length,
        advanced: filteredInitialChapters.filter(ch => {
          // Count indefinitely locked chapters as advanced
          if (isIndefinitelyLocked(ch)) return true;
          
          const isAdvanced = ch.publish_at && 
                           ch.publish_at > serverNow && // Future publish date
                           (ch.coins ?? 0) > 0;
          const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
          return isAdvanced && !isAccessible;
        }).length
      });
    }

    setVolumeCounts(counts);
  }, [volumes, filteredInitialChapters, getServerTime, isIndefinitelyLocked]);

  // Sort function that puts extra chapters last
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

  // Fetch chapters from API
  const fetchChapters = useCallback(async (
    page: number,
    chapterType: ChapterTypeFilter,
    volumeId: string | null
  ) => {
    // Only request advanced chapters when explicitly in advanced mode
    const showAdvanced = chapterType === 'advanced';
    
    return await getChaptersForList({
      novelId,
      page,
      userId: userProfile?.id,
      showAdvanced,
      volumeId,
      // Only include access info when needed (for advanced chapters or when user is logged in)
      includeAccess: showAdvanced || (isAuthenticated && userProfile?.id != null)
    });
  }, [novelId, userProfile?.id, isAuthenticated]);

  // Function to load chapters and update state
  const loadChapters = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // For 'all' mode, we need to make two separate requests to get both types efficiently
      if (chapterTypeFilter === 'all') {
        const [regularResult, advancedResult] = await Promise.all([
          getChaptersForList({
            novelId,
            page: pageNum,
            userId: userProfile?.id,
            showAdvanced: false,
            volumeId: selectedVolumeId,
            includeAccess: isAuthenticated && userProfile?.id != null
          }),
          getChaptersForList({
            novelId,
            page: pageNum,
            userId: userProfile?.id,
            showAdvanced: true,
            volumeId: selectedVolumeId,
            includeAccess: isAuthenticated && userProfile?.id != null
          })
        ]);

        // Combine the results, ensuring no duplicates by ID
        const uniqueChaptersMap = new Map();
        
        // First add all regular chapters
        regularResult.chapters.forEach(chapter => {
          uniqueChaptersMap.set(chapter.id, chapter);
        });
        
        // Then add advanced chapters (will overwrite if same ID)
        advancedResult.chapters.forEach(chapter => {
          uniqueChaptersMap.set(chapter.id, chapter);
        });
        
        // Convert map back to array and sort
        const combinedChapters = Array.from(uniqueChaptersMap.values()).sort(sortChapters);

        setChapters(combinedChapters);
        setChapterCounts({
          regularCount: regularResult.counts.regularCount,
          advancedCount: advancedResult.counts.advancedCount,
          total: regularResult.counts.total + advancedResult.counts.total
        });
        setCurrentPage(pageNum);
        setTotalPages(Math.max(regularResult.totalPages, advancedResult.totalPages));
      } else {
        // For specific types, just make one request
        const result = await fetchChapters(
          pageNum,
          chapterTypeFilter,
          selectedVolumeId
        );

        setChapters(result.chapters);
        setChapterCounts(result.counts);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      setError('Failed to load chapters. Please try again.');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [fetchChapters, chapterTypeFilter, selectedVolumeId, userProfile?.id, isAuthenticated, novelId, sortChapters]);

  // Initial load effect
  useEffect(() => {
    if (!isInitialMount.current) return;
    
    if (filteredInitialChapters && filteredInitialChapters.length > 0) {
      const serverNow = getServerTime().toISOString();
      
      // Calculate regular chapters (free or published)
      const regularChapters = filteredInitialChapters.filter(ch => {
        // Don't count indefinitely locked chapters as regular
        if (isIndefinitelyLocked(ch)) return false;
        
        const isFree = !ch.coins || ch.coins === 0;
        const isPublished = !ch.publish_at || ch.publish_at <= serverNow;
        const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
        return isFree || isPublished || isAccessible;
      });

      // Calculate advanced chapters (future publish date with coins, not unlocked)
      const advancedChapters = filteredInitialChapters.filter(ch => {
        // Count indefinitely locked chapters as advanced
        if (isIndefinitelyLocked(ch)) return true;
        
        const isAdvanced = ch.publish_at && 
                         ch.publish_at > serverNow && // Future publish date
                         (ch.coins ?? 0) > 0;
        const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
        return isAdvanced && !isAccessible;
      });

      setChapterCounts({
        regularCount: regularChapters.length,
        advancedCount: advancedChapters.length,
        total: filteredInitialChapters.length
      });
    } else {
      loadChapters(1);
    }
    
    isInitialMount.current = false;
  }, [filteredInitialChapters, loadChapters, getServerTime, isIndefinitelyLocked]);

  // Effect to handle filter changes
  const prevFiltersRef = useRef({
    chapterTypeFilter,
    selectedVolumeId
  });
  
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const prevFilters = prevFiltersRef.current;
    
    if (
      prevFilters.chapterTypeFilter !== chapterTypeFilter ||
      prevFilters.selectedVolumeId !== selectedVolumeId
    ) {
      setCurrentPage(1);
      loadChapters(1);
      
      prevFiltersRef.current = {
        chapterTypeFilter,
        selectedVolumeId
      };
    }
  }, [chapterTypeFilter, selectedVolumeId, loadChapters]);

  // Update chapters when filters change and we're using initialChapters
  useEffect(() => {
    // Don't update chapters directly if we're loading from API
    if (isInitialMount.current || loadingRef.current) return;
    
    // Only update directly from filteredChaptersByType if we have initialChapters
    // and we're not making an API request
    if (initialChapters && initialChapters.length > 0 && !isLoading) {
      setChapters(filteredChaptersByType);
    }
  }, [filteredChaptersByType, initialChapters, isLoading]);

  // Effect to handle page changes
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (isInitialMount.current) return;
    
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
    // Utility to check if a chapter is locked indefinitely (50+ years in the future)
    const isIndefinitelyLocked = (ch: ChapterListItem): boolean => {
      if (!ch.publish_at) return false;
      const publishDate = new Date(ch.publish_at);
      const fiftyYearsFromNow = new Date();
      fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
      return publishDate > fiftyYearsFromNow;
    };
    
    // If the chapter is indefinitely locked, it's not considered published
    if (isIndefinitelyLocked(chapter)) return false;
    
    return !chapter.publish_at || 
           new Date(chapter.publish_at) <= getServerTime() ||
           !chapter.coins ||
           chapter.coins === 0 ||
           !!chapter.isUnlocked ||
           !!chapter.hasTranslatorAccess;
  }, [getServerTime]);

  const renderChapter = useCallback((chapter: ChapterListItem) => (
    chapter.chapter_number >= 0 && (
      <div key={chapter.id} className="hover:bg-accent/20 transition-all rounded-md">
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
      <div className="flex items-center justify-center gap-2 py-4">
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

  // Create a filtered list of advanced chapters that are not unlocked for the bulk purchase modal
  const purchasableAdvancedChapters = useMemo(() => {
    const serverNow = getServerTime().toISOString();
    
    return chapters.filter(ch => {
      const isAdvanced = ch.publish_at && 
                       ch.publish_at > serverNow && // Future publish date
                       (ch.coins ?? 0) > 0;
      const isAccessible = ch.isUnlocked || ch.hasTranslatorAccess;
      return isAdvanced && !isAccessible;
    });
  }, [chapters, getServerTime]);

  // Count of active filters to show
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedVolumeId) count++;
    if (chapterTypeFilter !== 'all') count++;
    return count;
  }, [selectedVolumeId, chapterTypeFilter]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeDropdownRef.current && !volumeDropdownRef.current.contains(event.target as Node)) {
        setShowVolumeDescription(false);
      }
      if (chapterTypeDropdownRef.current && !chapterTypeDropdownRef.current.contains(event.target as Node)) {
        setShowChapterTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto relative">
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-visible relative">
        {/* Unified Filter Bar */}
        <div className="p-3 bg-accent/50 border-b border-border flex flex-col md:flex-row gap-3 relative">
          {/* Dropdown Containers - Positioned outside the scroll container */}
          {showVolumeDescription && (
            <div className="absolute z-[9999] left-3 top-[calc(100%-0.5rem)] bg-background border border-border rounded-lg shadow-lg min-w-[200px] max-h-[400px] overflow-y-auto">
              <div className="p-1">
                <button
                  onClick={() => {
                    setSelectedVolumeId(null);
                    setShowVolumeDescription(false);
                  }}
                  className={`w-full px-3 py-2 text-left rounded-md text-sm ${!selectedVolumeId ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Volumes</span>
                    <span className="text-xs opacity-70">{volumeCounts.get('all')?.total || 0}</span>
                  </div>
                </button>
                
                {volumes.map(volume => (
                  <button
                    key={volume.id}
                    onClick={() => {
                      setSelectedVolumeId(volume.id);
                      setShowVolumeDescription(false);
                    }}
                    className={`w-full px-3 py-2 text-left rounded-md text-sm ${selectedVolumeId === volume.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {volume.title 
                          ? `Vol ${volume.volume_number}: ${volume.title}` 
                          : `Volume ${volume.volume_number}`}
                      </span>
                      <span className="text-xs opacity-70">{volumeCounts.get(volume.id)?.total || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {showChapterTypeDropdown && (
            <div className="absolute z-[9999] right-3 top-[calc(100%-0.5rem)] bg-background border border-border rounded-lg shadow-lg min-w-[200px]">
              <div className="p-1">
                <button
                  onClick={() => {
                    setChapterTypeFilter('all');
                    setShowChapterTypeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left rounded-md text-sm ${chapterTypeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:document-linear" className="w-4 h-4" />
                    <span>All Chapter Types</span>
                    <span className="text-xs opacity-70">({volumeCounts.get(selectedVolumeId || 'all')?.total || 0})</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setChapterTypeFilter('regular');
                    setShowChapterTypeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left rounded-md text-sm ${chapterTypeFilter === 'regular' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:book-linear" className="w-4 h-4" />
                    <span>Regular Chapters</span>
                    <span className="text-xs opacity-70">({chapterCounts.regularCount})</span>
                  </div>
                </button>
                {chapterCounts.advancedCount > 0 && (
                  <button
                    onClick={() => {
                      setChapterTypeFilter('advanced');
                      setShowChapterTypeDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left rounded-md text-sm ${chapterTypeFilter === 'advanced' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:crown-linear" className="w-4 h-4" />
                      <span>Advanced Chapters</span>
                      <span className="text-xs opacity-70">({chapterCounts.advancedCount})</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible no-scrollbar">
            <div className="relative inline-block flex-shrink-0" ref={volumeDropdownRef}>
              <button 
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:border-primary/50 transition-colors"
                onClick={() => {
                  setShowVolumeDescription(!showVolumeDescription);
                  setShowChapterTypeDropdown(false);
                }}
              >
                <Icon icon="solar:book-broken" className="w-4 h-4" />
                <span>
                  {selectedVolumeId 
                    ? volumes.find(v => v.id === selectedVolumeId)?.title 
                      ? `Vol ${volumes.find(v => v.id === selectedVolumeId)?.volume_number}: ${volumes.find(v => v.id === selectedVolumeId)?.title}`
                      : `Volume ${volumes.find(v => v.id === selectedVolumeId)?.volume_number}`
                    : 'All Volumes'}
                </span>
                <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4 opacity-70" />
              </button>
            </div>
            
            <div className="relative inline-block flex-shrink-0" ref={chapterTypeDropdownRef}>
              <button 
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:border-primary/50 transition-colors"
                onClick={() => {
                  setShowChapterTypeDropdown(!showChapterTypeDropdown);
                  setShowVolumeDescription(false);
                }}
              >
                {chapterTypeFilter === 'advanced' ? (
                  <>
                    <Icon icon="solar:crown-linear" className="w-4 h-4" />
                    <span>Advanced Chapters</span>
                    <span className="text-xs opacity-70">({chapterCounts.advancedCount})</span>
                  </>
                ) : chapterTypeFilter === 'regular' ? (
                  <>
                    <Icon icon="solar:book-linear" className="w-4 h-4" />
                    <span>Regular Chapters</span>
                    <span className="text-xs opacity-70">({chapterCounts.regularCount})</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:document-linear" className="w-4 h-4" />
                    <span>All Chapter Types</span>
                    <span className="text-xs opacity-70">({volumeCounts.get(selectedVolumeId || 'all')?.total || 0})</span>
                  </>
                )}
                <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4 opacity-70" />
              </button>
            </div>
            
            {/* Active filter indicator */}
            {activeFilterCount > 0 && (
              <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            )}
            
            {/* Reset filters button */}
            {activeFilterCount > 0 && (
              <button 
                onClick={() => {
                  setSelectedVolumeId(null);
                  setChapterTypeFilter('all');
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                Reset
              </button>
            )}
            
            {/* Bulk Purchase Button */}
            {isAuthenticated && purchasableAdvancedChapters.length > 1 && (
              <button
                onClick={() => setIsBulkPurchaseModalOpen(true)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Icon icon="solar:cart-3-linear" className="w-4 h-4" />
                Bulk Purchase
              </button>
            )}
          </div>
        </div>

        {/* Volume Description (only show when a volume is selected) */}
        {selectedVolume?.description && selectedVolumeId && (
          <div className="px-4 py-3 border-b border-border bg-accent/20">
            <h4 className="text-sm font-medium mb-1">
              Volume {selectedVolume.volume_number}{selectedVolume.title ? `: ${selectedVolume.title}` : ''}
            </h4>
            <p className="text-sm text-muted-foreground">
              {selectedVolume.description}
            </p>
          </div>
        )}

        {/* Chapter List */}
        <div className="chapter-list-grid p-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Icon icon="solar:refresh-circle-linear" className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Loading chapters...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[...chapters].sort(sortChapters).map(renderChapter)}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Icon icon="solar:empty-file-linear" className="w-12 h-12 mx-auto mb-2" />
              <p>No chapters available</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedVolumeId(null);
                    setChapterTypeFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Bulk Purchase Modal */}
      <BulkPurchaseModal
        isOpen={isBulkPurchaseModalOpen}
        onClose={() => setIsBulkPurchaseModalOpen(false)}
        advancedChapters={purchasableAdvancedChapters}
        userProfileId={userProfile?.id}
        novelId={novelId}
        novelAuthorId={novelAuthorId}
      />
    </div>
  );
}; 