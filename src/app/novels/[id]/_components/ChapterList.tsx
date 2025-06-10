import { UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem as ChapterListItemComponent } from './ChapterListItem';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { getChaptersForList, ChapterListItem } from '@/services/chapterService';
import { useServerTimeContext } from '@/providers/ServerTimeProvider';
import dynamic from 'next/dynamic';
import Pagination from '@/components/Pagination';
import { ChapterFilterBar } from './ChapterFilterBar';
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

// Lazy-load BulkPurchaseModal so it's removed from the initial bundle
const BulkPurchaseModal = dynamic(() => import('./BulkPurchaseModal').then(m => m.BulkPurchaseModal), { ssr: false });

export const ChapterList = ({
  initialChapters,
  novelId,
  novelSlug,
  userProfile,
  isAuthenticated,
  novelAuthorId,
  volumes = []
}: ChapterListProps) => {
  const latestRequestRef = useRef(0);
  const { getServerTime } = useServerTimeContext();
  
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);

  // Track first render for certain effects
  const isInitialMount = useRef(true);

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

  // Function to load chapters and update state with a race-condition guard
  const loadChapters = useCallback(
    async (pageNum: number) => {
      // Increment the request token; any previous in-flight requests with a
      // smaller token will be considered stale when they resolve.
      const requestToken = ++latestRequestRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchChapters(pageNum, selectedVolumeId);

        // Ignore the response if it's not from the latest request
        if (requestToken !== latestRequestRef.current) return;

        setChapters(result.chapters);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
      } catch (error) {
        // Only surface the error if this request is still the latest
        if (requestToken === latestRequestRef.current) {
          console.error('Error loading chapters:', error);
          setError('Failed to load chapters. Please try again.');
        }
      } finally {
        // Only clear the loading state if this request is still the latest
        if (requestToken === latestRequestRef.current) {
          setIsLoading(false);
        }
      }
    },
    [fetchChapters, selectedVolumeId]
  );

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

  // Helper to apply client-side pagination on initial chapters (includes advanced)
  const getLocalChapters = useCallback(
    (pageNum: number, volId: string | null) => {
      if (!filteredInitialChapters || filteredInitialChapters.length === 0) return null;

      let source = filteredInitialChapters;
      if (volId) {
        source = source.filter(ch => ch.volume_id === volId);
      }

      const limit = 50;
      const start = (pageNum - 1) * limit;
      const end = Math.min(start + limit, source.length);
      const paginated = source.slice(start, end);

      return {
        chapters: paginated,
        totalPages: Math.ceil(source.length / limit)
      };
    },
    [filteredInitialChapters]
  );

  // Effect to handle filter changes
  const prevFiltersRef = useRef({
    selectedVolumeId
  });
  
  useEffect(() => {
    if (isInitialMount.current) return;

    const prevFilters = prevFiltersRef.current;
    
    if (prevFilters.selectedVolumeId !== selectedVolumeId) {
      setCurrentPage(1);

      const local = getLocalChapters(1, selectedVolumeId);
      if (local) {
        setChapters(local.chapters);
        setTotalPages(local.totalPages);
      } else {
        loadChapters(1);
      }
      
      prevFiltersRef.current = {
        selectedVolumeId
      };
    }
  }, [selectedVolumeId, loadChapters, getLocalChapters]);

  // Effect to handle page changes
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (isInitialMount.current) return;

    if (prevPageRef.current !== currentPage) {
      const local = getLocalChapters(currentPage, selectedVolumeId);
      if (local) {
        setChapters(local.chapters);
        setTotalPages(local.totalPages);
      } else {
        loadChapters(currentPage);
      }
      prevPageRef.current = currentPage;
    }
  }, [currentPage, loadChapters, selectedVolumeId, getLocalChapters]);

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

  // Count of active filters to show
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (volumes.length > 0 && selectedVolumeId) count++;
    return count;
  }, [selectedVolumeId, volumes.length]);

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
    let chaptersToFilter = filteredInitialChapters;
    
    // If a volume is selected, filter chapters by volume
    if (selectedVolumeId) {
      chaptersToFilter = filteredInitialChapters.filter(chapter => chapter.volume_id === selectedVolumeId);
    }
    
    return chaptersToFilter.filter(chapter => {
      const hasFuturePublishDate = chapter.publish_at && new Date(chapter.publish_at) > getServerTime();
      const hasCost = (chapter.coins || 0) > 0;
      const isNotAuthor = userProfile?.id !== novelAuthorId;
      const isNotUnlocked = !isChapterUnlocked(chapter);
      
      return hasFuturePublishDate && hasCost && isNotAuthor && isNotUnlocked;
    });
  }, [filteredInitialChapters, getServerTime, userProfile?.id, novelAuthorId, isChapterUnlocked, selectedVolumeId]);

  // Memoised lookup so we don't run .find on every render
  const selectedVolume = useMemo(() => {
    return volumes.find(v => v.id === selectedVolumeId);
  }, [volumes, selectedVolumeId]);

  return (
    <>
      <div className="mt-6 md:-mt-0 flex flex-col gap-4">
        <div className="overflow-visible relative">
          {/* Filter Bar */}
          <ChapterFilterBar
            novelSlug={novelSlug}
            volumes={volumes}
            volumeCounts={volumeCounts}
            selectedVolumeId={selectedVolumeId}
            setSelectedVolumeId={setSelectedVolumeId}
            isAuthenticated={isAuthenticated}
            userProfile={userProfile}
            allAdvancedChapters={allAdvancedChapters}
            onOpenBulkPurchase={() => setIsBulkPurchaseModalOpen(true)}
            activeFilterCount={activeFilterCount}
          />

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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
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