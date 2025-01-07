import { Icon } from '@iconify/react';
import { Volume, ChapterListChapter } from '../_types/authorTypes';
import ChapterListItem from './ChapterListItem';

interface VolumeSectionProps {
  volume: Volume;
  chapters: ChapterListChapter[];
  editingChapterId?: string;
  isCollapsed: boolean;
  onToggleCollapse: (volumeId: string) => void;
  onDeleteVolume: (volumeId: string) => void;
  onAssignChapters: (volumeId: string) => void;
  onCreateChapter: (volumeId: string) => void;
  onEditChapter: (chapter: ChapterListChapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onUnassignChapter: (chapterId: string) => void;
}

export default function VolumeSection({
  volume,
  chapters,
  editingChapterId,
  isCollapsed,
  onToggleCollapse,
  onDeleteVolume,
  onAssignChapters,
  onCreateChapter,
  onEditChapter,
  onDeleteChapter,
  onUnassignChapter
}: VolumeSectionProps) {
  return (
    <div className="border-t border-border first:border-t-0">
      <div className="bg-accent/50 px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleCollapse(volume.id)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
            aria-label={isCollapsed ? "Expand volume" : "Collapse volume"}
          >
            <Icon 
              icon={isCollapsed ? "mdi:chevron-right" : "mdi:chevron-down"} 
              className="w-4 h-4"
            />
          </button>
          <h3 className="text-sm font-medium text-foreground">
            Volume {volume.volumeNumber}: {volume.title}
          </h3>
          <button
            onClick={() => onDeleteVolume(volume.id)}
            className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
            title="Delete volume"
          >
            <Icon icon="mdi:delete-outline" className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAssignChapters(volume.id)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
          >
            <Icon icon="mdi:file-move" className="w-3.5 h-3.5" />
            Assign Chapters
          </button>
          <button
            onClick={() => onCreateChapter(volume.id)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
          >
            <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
            Add Chapter
          </button>
        </div>
      </div>
      <div className={`divide-y divide-border ${isCollapsed ? 'hidden' : ''}`}>
        {chapters
          .sort((a, b) => a.chapter_number - b.chapter_number)
          .map(chapter => (
            <ChapterListItem
              key={chapter.id}
              chapter={chapter}
              editingChapterId={editingChapterId}
              onEditChapter={onEditChapter}
              onDeleteClick={onDeleteChapter}
              onUnassignChapter={onUnassignChapter}
            />
          ))}
      </div>
    </div>
  );
} 