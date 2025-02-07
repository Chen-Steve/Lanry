import { UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem as ChapterListItemComponent } from './ChapterListItem';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { getChaptersForList, ChapterListItem, getChapterCounts, ChapterCounts } from '@/services/chapterService';
import { useInView } from 'react-intersection-observer';

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { ref: loadMoreRef, inView } = useInView();

  // Load total counts
  useEffect(() => {
    const loadCounts = async () => {
      const counts = await getChapterCounts(novelId);
      setChapterCounts(counts);
    };
    loadCounts();
  }, [novelId]);

  // Initial load of chapters
  useEffect(() => {
    const loadInitialChapters = async () => {
      // Only load if we have no chapters and we're not already loading
      if (!isLoading && (!initialChapters || initialChapters.length === 0) && chapters.length === 0) {
        setIsLoading(true);
        try {
          const result = await getChaptersForList({
            novelId,
            page: 1,
            userId: userProfile?.id
          });
          setChapters(result.chapters);
          setHasMore(result.chapters.length === 50);
        } catch (error) {
          console.error('Error loading initial chapters:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadInitialChapters();
  }, [novelId, userProfile?.id, initialChapters, chapters.length, isLoading]);

  const loadMoreChapters = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await getChaptersForList({
        novelId,
        page: nextPage,
        userId: userProfile?.id
      });

      if (result.chapters.length === 0) {
        setHasMore(false);
      } else {
        // Use a Set to track unique chapter IDs and prevent duplicates
        setChapters(prev => {
          const existingIds = new Set(prev.map(ch => ch.id));
          const newChapters = result.chapters.filter(ch => !existingIds.has(ch.id));
          return [...prev, ...newChapters];
        });
        setPage(nextPage);
        setHasMore(result.chapters.length === 50);
      }
    } catch (error) {
      console.error('Error loading more chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, novelId, userProfile?.id]);

  useEffect(() => {
    if (inView && !isLoading) {
      loadMoreChapters();
    }
  }, [inView, isLoading, loadMoreChapters]);

  const { advancedChapters, regularChapters } = useMemo(() => {
    if (!chapters || chapters.length === 0) {
      return {
        advancedChapters: [],
        regularChapters: []
      };
    }

    const now = new Date();
    return chapters.reduce((acc, chapter) => {
      if (!chapter) return acc;
      
      // Advanced chapters are those with a future publish date
      const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
      if (publishDate && publishDate > now) {
        acc.advancedChapters.push(chapter);
      } else {
        acc.regularChapters.push(chapter);
      }
      return acc;
    }, { advancedChapters: [] as ChapterListItem[], regularChapters: [] as ChapterListItem[] });
  }, [chapters]);

  // Debug log to check chapters distribution
  useEffect(() => {
    console.log('Advanced Chapters:', advancedChapters.length);
    console.log('Regular Chapters:', regularChapters.length);
    console.log('Show Advanced:', showAdvancedChapters);
  }, [advancedChapters.length, regularChapters.length, showAdvancedChapters]);

  const currentChapters = useMemo(() => {
    const chaptersToShow = showAdvancedChapters ? advancedChapters : regularChapters;
    console.log('Chapters to show:', chaptersToShow.length);
    
    if (showAllChapters || !selectedVolumeId) {
      return chaptersToShow.sort((a, b) => {
        if (a.chapter_number !== b.chapter_number) {
          return a.chapter_number - b.chapter_number;
        }
        const partA = a.part_number || 0;
        const partB = b.part_number || 0;
        return partA - partB;
      });
    }
    return chaptersToShow
      .filter(chapter => chapter.volume_id === selectedVolumeId)
      .sort((a, b) => {
        if (a.chapter_number !== b.chapter_number) {
          return a.chapter_number - b.chapter_number;
        }
        const partA = a.part_number || 0;
        const partB = b.part_number || 0;
        return partA - partB;
      });
  }, [selectedVolumeId, showAdvancedChapters, advancedChapters, regularChapters, showAllChapters]);

  const renderChapter = (chapter: ChapterListItem) => (
    <div key={chapter.id} className="w-full h-10 flex items-center px-4">
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
      />
    </div>
  );

  const selectedVolume = volumes.find(v => v.id === selectedVolumeId);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Chapter Type Selector */}
        <div className="flex items-center p-2 bg-accent/50 border-b border-border overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-full">
            <button
              onClick={() => setShowAdvancedChapters(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2
                ${!showAdvancedChapters 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2
                  ${showAdvancedChapters 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${showAllChapters 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
              >
                All Chapters
                <span className="ml-2 text-xs">
                  ({currentChapters.length})
                </span>
              </button>
              {volumes.map(volume => (
                <button
                  key={volume.id}
                  onClick={() => {
                    setSelectedVolumeId(volume.id);
                    setShowAllChapters(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${selectedVolumeId === volume.id && !showAllChapters
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Volume {volume.volume_number}{volume.title ? `: ${volume.title}` : ''}
                  <span className="ml-2 text-xs">
                    ({currentChapters.filter(c => c.volume_id === volume.id).length})
                  </span>
                </button>
              ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2">
          {currentChapters.length > 0 ? (
            <>
              {currentChapters.map(chapter => (
                <div 
                  key={chapter.id} 
                  className="h-10"
                >
                  {renderChapter(chapter)}
                </div>
              ))}
              {hasMore && (
                <div 
                  ref={loadMoreRef} 
                  className="col-span-2 py-4 text-center"
                >
                  {isLoading ? (
                    <Icon icon="solar:spinner-line-duotone" className="w-6 h-6 animate-spin" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading more chapters...</span>
                  )}
                </div>
              )}
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