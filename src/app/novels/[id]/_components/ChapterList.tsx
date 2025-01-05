import { Chapter, UserProfile } from '@/types/database';
import { Volume } from '@/types/novel';
import { ChapterListItem } from './ChapterListItem';
import { useMemo, useState } from 'react';

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

  const chaptersGroupedByVolume = useMemo(() => {
    const noVolumeChapters = chapters.filter(chapter => !chapter.volume_id);
    const volumeChapters = new Map<string, Chapter[]>();
    
    volumes.forEach(volume => {
      volumeChapters.set(volume.id, chapters.filter(chapter => chapter.volume_id === volume.id));
    });

    return {
      noVolumeChapters,
      volumeChapters
    };
  }, [chapters, volumes]);

  const currentChapters = useMemo(() => {
    if (!selectedVolumeId) {
      return chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    }
    return chaptersGroupedByVolume.volumeChapters.get(selectedVolumeId) || [];
  }, [selectedVolumeId, chaptersGroupedByVolume, chapters]);

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
        {/* Volume Selector */}
        {volumes.length > 0 && (
          <>
            <div className="flex items-center gap-2 p-2 bg-accent/50 border-b border-border overflow-x-auto scrollbar-hide">
              {volumes.map(volume => (
                <button
                  key={volume.id}
                  onClick={() => setSelectedVolumeId(volume.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${selectedVolumeId === volume.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Volume {volume.volume_number}{volume.title ? `: ${volume.title}` : ''}
                  <span className="ml-2 text-xs">
                    ({(chaptersGroupedByVolume.volumeChapters.get(volume.id) || []).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Volume Description */}
            {selectedVolume?.description && (
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
          {(volumes.length === 0 ? chapters : currentChapters)
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .map(chapter => (
              <div 
                key={chapter.id} 
                className="h-10"
              >
                {renderChapter(chapter)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}; 