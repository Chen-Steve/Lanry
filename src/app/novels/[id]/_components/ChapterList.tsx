import { UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem as ChapterListItemComponent } from './ChapterListItem';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { getChaptersForList, ChapterListItem } from '@/services/chapterService';
import { useServerTimeContext } from '@/providers/ServerTimeProvider';
import { BulkPurchaseModal } from './BulkPurchaseModal';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';

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
  const volumeButtonRef = useRef<HTMLButtonElement>(null);
  const [volumeButtonWidth, setVolumeButtonWidth] = useState<number>(0);
  const { getServerTime } = useServerTimeContext();
  
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [showVolumeDescription, setShowVolumeDescription] = useState(false);
  
  // Update button width when it changes
  useEffect(() => {
    if (volumeButtonRef.current) {
      // Add a small buffer (20px) to ensure text fits comfortably
      setVolumeButtonWidth(volumeButtonRef.current.offsetWidth + 20);
    }
  }, [volumes, selectedVolumeId]); // Update when volumes or selection changes

  // Filter out draft chapters (negative chapter_number) from initialChapters
  const filteredInitialChapters = useMemo(() => {
    return (initialChapters || []).filter(ch => ch.chapter_number >= 0);
  }, [initialChapters]);

  const [chapters, setChapters] = useState<ChapterListItem[]>(filteredInitialChapters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeCounts, setVolumeCounts] = useState(new Map<string, { total: number }>());
  const [isBulkPurchaseModalOpen, setIsBulkPurchaseModalOpen] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const [showPageInput, setShowPageInput] = useState(false);
  const [userUnlocks, setUserUnlocks] = useState<{ chapter_number: number; part_number: number | null; }[]>([]);

  // Calculate volume-specific counts
  useEffect(() => {
    const counts = new Map<string, { total: number }>();
    
    // Add an "All Volumes" entry
    counts.set('all', {
      total: filteredInitialChapters.length
    });
    
    volumes.forEach(volume => {
      const volumeChapters = filteredInitialChapters.filter(ch => ch.volume_id === volume.id);
      counts.set(volume.id, {
        total: volumeChapters.length
      });
    });

    setVolumeCounts(counts);
  }, [volumes, filteredInitialChapters]);

  // Fetch chapters from API
  const fetchChapters = useCallback(async (
    page: number,
    volumeId: string | null
  ) => {
    return await getChaptersForList({
      novelId,
      page,
      userId: userProfile?.id,
      volumeId,
      includeAccess: isAuthenticated && userProfile?.id != null
    });
  }, [novelId, userProfile?.id, isAuthenticated]);

  // Function to load chapters and update state
  const loadChapters = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchChapters(pageNum, selectedVolumeId);
      setChapters(result.chapters);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading chapters:', error);
      setError('Failed to load chapters. Please try again.');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [fetchChapters, selectedVolumeId]);

  // Initial load effect
  useEffect(() => {
    if (!isInitialMount.current) return;
    
    if (filteredInitialChapters && filteredInitialChapters.length > 0) {
      // Calculate total pages based on 50 chapters per page
      const limit = 50;
      const total = filteredInitialChapters.length;
      const calculatedTotalPages = Math.ceil(total / limit);
      
      // Get the first page of chapters
      const start = 0;
      const end = Math.min(limit, total);
      const firstPageChapters = filteredInitialChapters.slice(start, end);
      
      setChapters(firstPageChapters);
      setCurrentPage(1);
      setTotalPages(calculatedTotalPages);
    } else {
      loadChapters(1);
    }
    
    isInitialMount.current = false;
  }, [filteredInitialChapters, loadChapters]);

  // Effect to handle filter changes
  const prevFiltersRef = useRef({
    selectedVolumeId
  });
  
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const prevFilters = prevFiltersRef.current;
    
    if (prevFilters.selectedVolumeId !== selectedVolumeId) {
      setCurrentPage(1);
      loadChapters(1);
      
      prevFiltersRef.current = {
        selectedVolumeId
      };
    }
  }, [selectedVolumeId, loadChapters]);

  // Effect to handle page changes
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (isInitialMount.current) return;
    
    if (prevPageRef.current !== currentPage) {
      if (filteredInitialChapters && filteredInitialChapters.length > 0) {
        // Handle pagination for initial chapters
        const limit = 50;
        const start = (currentPage - 1) * limit;
        const end = Math.min(start + limit, filteredInitialChapters.length);
        const paginatedChapters = filteredInitialChapters.slice(start, end);
        setChapters(paginatedChapters);
      } else {
        // Load from API
        loadChapters(currentPage);
      }
      prevPageRef.current = currentPage;
    }
  }, [currentPage, loadChapters, filteredInitialChapters]);

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

  // Handle page input
  const handlePageInputSubmit = useCallback((value: string) => {
    const pageNum = parseInt(value);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setShowPageInput(false);
      setPageInputValue('');
    }
  }, [handlePageChange, totalPages]);

  const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit(pageInputValue);
    } else if (e.key === 'Escape') {
      setShowPageInput(false);
      setPageInputValue('');
    }
  }, [pageInputValue, handlePageInputSubmit]);

  // Count of active filters to show
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (volumes.length > 0 && selectedVolumeId) count++;
    return count;
  }, [selectedVolumeId, volumes.length]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeDropdownRef.current && !volumeDropdownRef.current.contains(event.target as Node)) {
        setShowVolumeDescription(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user unlocks for bulk purchase filtering
  useEffect(() => {
    const fetchUserUnlocks = async () => {
      if (!isAuthenticated || !userProfile?.id) {
        setUserUnlocks([]);
        return;
      }

      try {
        const { data: unlocks } = await supabase
          .from('chapter_unlocks')
          .select('chapter_number, part_number')
          .eq('novel_id', novelId)
          .eq('profile_id', userProfile.id);

        setUserUnlocks(unlocks || []);
      } catch (error) {
        console.error('Error fetching user unlocks:', error);
        setUserUnlocks([]);
      }
    };

    fetchUserUnlocks();
  }, [isAuthenticated, userProfile?.id, novelId]);

  // Helper function to check if a chapter is unlocked
  const isChapterUnlocked = useCallback((chapter: { chapter_number: number; part_number?: number | null }) => {
    return userUnlocks.some(unlock => 
      unlock.chapter_number === chapter.chapter_number && 
      unlock.part_number === (chapter.part_number ?? null)
    );
  }, [userUnlocks]);

  // Get all advanced chapters in the novel for bulk purchase modal
  const allAdvancedChapters = useMemo(() => {
    return filteredInitialChapters.filter(chapter => {
      const hasFuturePublishDate = chapter.publish_at && new Date(chapter.publish_at) > getServerTime();
      const hasCost = (chapter.coins || 0) > 0;
      const isNotAuthor = userProfile?.id !== novelAuthorId;
      const isNotUnlocked = !isChapterUnlocked(chapter);
      
      return hasFuturePublishDate && hasCost && isNotAuthor && isNotUnlocked;
    });
  }, [filteredInitialChapters, getServerTime, userProfile?.id, novelAuthorId, isChapterUnlocked]);

  // Volume Description (only show when a volume is selected)
  const selectedVolume = volumes.find(v => v.id === selectedVolumeId);

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
      <div className="flex items-center justify-center gap-2 flex-wrap">
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
            {startPage > 2 && (
              showPageInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInputValue}
                    onChange={(e) => setPageInputValue(e.target.value)}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={() => {
                      if (pageInputValue) {
                        handlePageInputSubmit(pageInputValue);
                      } else {
                        setShowPageInput(false);
                      }
                    }}
                    placeholder="Page"
                    className="w-16 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">/{totalPages}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowPageInput(true);
                    setPageInputValue(currentPage.toString());
                  }}
                  className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                  disabled={isLoading}
                  title="Click to jump to page"
                >
                  ...
                </button>
              )
            )}
          </>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              showPageInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInputValue}
                    onChange={(e) => setPageInputValue(e.target.value)}
                    onKeyDown={handlePageInputKeyDown}
                    onBlur={() => {
                      if (pageInputValue) {
                        handlePageInputSubmit(pageInputValue);
                      } else {
                        setShowPageInput(false);
                      }
                    }}
                    placeholder="Page"
                    className="w-16 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">/{totalPages}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowPageInput(true);
                    setPageInputValue(currentPage.toString());
                  }}
                  className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                  disabled={isLoading}
                  title="Click to jump to page"
                >
                  ...
                </button>
              )
            )}
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
  }, [currentPage, totalPages, handlePageChange, isLoading, showPageInput, pageInputValue, handlePageInputKeyDown, handlePageInputSubmit]);

  return (
    <>
      <div className="mt-6 md:-mt-0 flex flex-col gap-4">
        <div className="overflow-visible relative">
          {/* Unified Filter Bar */}
          <div className="p-3 bg-accent/50 border-b border-border flex flex-col md:flex-row gap-3 relative">
            {/* Dropdown Containers - Positioned outside the scroll container */}
            {showVolumeDescription && volumes.length > 0 && (
              <div 
                className="absolute left-3 top-[calc(100%-0.5rem)] bg-background border border-border rounded-lg shadow-lg max-h-[400px] overflow-y-auto"
                style={{ width: `${volumeButtonWidth}px`, minWidth: '200px' }}
              >
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

            <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible no-scrollbar">
              <Link 
                href={`/novels/${novelSlug}`}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:border-primary/50 transition-colors"
              >
                <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                <span>Back</span>
              </Link>

              {/* Bulk Purchase Button */}
              {isAuthenticated && userProfile && allAdvancedChapters.length > 0 && (
                <button
                  onClick={() => setIsBulkPurchaseModalOpen(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground border border-primary rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:bg-primary/90 transition-colors"
                >
                  <span>Bulk Purchase</span>
                </button>
              )}

              {volumes.length > 0 && (
                <div className="relative inline-block flex-shrink-0" ref={volumeDropdownRef}>
                  <button 
                    ref={volumeButtonRef}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setShowVolumeDescription(!showVolumeDescription);
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
              )}
              
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
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  Reset
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
                  {chapters.map(chapter => (
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
                        isUnlocked={isChapterUnlocked(chapter)}
                        isPublished={!chapter.publish_at || new Date(chapter.publish_at) <= getServerTime()}
                      />
                    </div>
                  ))}
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
      </div>
      
      {/* Bulk Purchase Modal */}
      <BulkPurchaseModal
        isOpen={isBulkPurchaseModalOpen}
        onClose={() => setIsBulkPurchaseModalOpen(false)}
        advancedChapters={allAdvancedChapters}
        userProfileId={userProfile?.id}
        novelId={novelId}
        novelAuthorId={novelAuthorId}
      />
    </>
  );
}; 