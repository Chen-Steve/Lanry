import { Chapter, UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem } from './ChapterListItem';
import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';

interface ChapterListProps {
  chapters: (Chapter & { volume_id?: string })[];
  novelId: string;
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  novelAuthorId: string;
  volumes?: Volume[];
}

export const ChapterList = ({
  chapters,
  novelId,
  novelSlug,
  userProfile,
  isAuthenticated,
  novelAuthorId,
  volumes = []
}: ChapterListProps) => {
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(volumes[0]?.id || null);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [showAdvancedChapters, setShowAdvancedChapters] = useState(false);

  const { advancedChapters, regularChapters } = useMemo(() => {
    const now = new Date();
    return chapters.reduce((acc, chapter) => {
      if (chapter.publish_at && new Date(chapter.publish_at) > now) {
        acc.advancedChapters.push(chapter);
      } else {
        acc.regularChapters.push(chapter);
      }
      return acc;
    }, { advancedChapters: [] as Chapter[], regularChapters: [] as Chapter[] });
  }, [chapters]);

  const currentChapters = useMemo(() => {
    const chaptersToShow = showAdvancedChapters ? advancedChapters : regularChapters;
    
    if (showAllChapters || !selectedVolumeId) {
      return chaptersToShow.sort((a, b) => a.chapter_number - b.chapter_number);
    }
    return chaptersToShow
      .filter(chapter => chapter.volume_id === selectedVolumeId)
      .sort((a, b) => a.chapter_number - b.chapter_number);
  }, [selectedVolumeId, showAdvancedChapters, advancedChapters, regularChapters, showAllChapters]);

  const renderChapter = (chapter: Chapter) => (
    <div key={chapter.id} className="w-full h-10 flex items-center px-4">
      <ChapterListItem
        chapter={{
          ...chapter,
          novel_id: novelId
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
        <div className="flex items-center gap-2 p-2 bg-accent/50 border-b border-border">
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
              ({regularChapters.length})
            </span>
          </button>
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
              ({advancedChapters.length})
            </span>
          </button>
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
            currentChapters.map(chapter => (
              <div 
                key={chapter.id} 
                className="h-10"
              >
                {renderChapter(chapter)}
              </div>
            ))
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