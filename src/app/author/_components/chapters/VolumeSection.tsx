"use client";

import { Icon } from "@iconify/react";
import { Volume, ChapterListChapter } from "../../_types/authorTypes";
import ChapterBulkUpload from "../ChapterBulkUpload";
import ChapterRow from "./ChapterRow";

interface VolumeSectionProps {
  volume: Volume;
  chapters: ChapterListChapter[];
  isCollapsed: boolean;
  isEditing: boolean;
  editingTitle: string;
  isMassDeleting: boolean;
  selectedForDeletion: Set<string>;
  onToggleCollapse: (volumeId: string) => void;
  onEditVolume: (volume: Volume) => void;
  onDeleteVolume: (volumeId: string) => void;
  onChangeEditingTitle: (value: string) => void;
  onSaveEditingTitle: () => void;
  onCancelEditing: () => void;
  onEditChapter: (chapter: ChapterListChapter) => void;
  onUnassignChapter: (chapterId: string) => void;
  onDeleteChapterClick: (chapterId: string) => void;
  onToggleChapterForDeletion: (chapterId: string) => void;
  highlightedChapterId?: string;
  novelId: string;
  userId: string;
  onLoadChapters?: () => void | Promise<void>;
  onAssignChaptersClick: (volumeId: string) => void;
  onCreateChapter: (volumeId: string) => void;
}

export default function VolumeSection({
  volume,
  chapters,
  isCollapsed,
  isEditing,
  editingTitle,
  isMassDeleting,
  selectedForDeletion,
  onToggleCollapse,
  onEditVolume,
  onDeleteVolume,
  onChangeEditingTitle,
  onSaveEditingTitle,
  onCancelEditing,
  onEditChapter,
  onUnassignChapter,
  onDeleteChapterClick,
  onToggleChapterForDeletion,
  highlightedChapterId,
  novelId,
  userId,
  onLoadChapters,
  onAssignChaptersClick,
  onCreateChapter,
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
            <Icon icon={isCollapsed ? "mdi:chevron-right" : "mdi:chevron-down"} className="w-4 h-4" />
          </button>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Volume {volume.volumeNumber}:</span>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onChangeEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEditingTitle();
                  else if (e.key === "Escape") onCancelEditing();
                }}
                className="px-2 py-1 text-sm bg-background text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                placeholder="Volume title"
              />
              <button
                onClick={onSaveEditingTitle}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full transition-colors"
                title="Save changes"
              >
                <Icon icon="mdi:check" className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEditing}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                title="Cancel editing"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-foreground">Volume {volume.volumeNumber}{volume.title ? `: ${volume.title}` : ''}</h3>
              <button
                onClick={() => onEditVolume(volume)}
                className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                title="Edit volume name"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteVolume(volume.id)}
                className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                title="Delete volume"
              >
                <Icon icon="mdi:delete-outline" className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAssignChaptersClick(volume.id)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
          >
            <Icon icon="mdi:file-move" className="w-3.5 h-3.5" />
            Assign Chapters
          </button>
          <ChapterBulkUpload
            novelId={novelId}
            userId={userId}
            volumeId={volume.id}
            onUploadComplete={() => {
              if (onLoadChapters) onLoadChapters();
            }}
          />
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
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            isHighlighted={highlightedChapterId === chapter.id}
            isMassDeleting={isMassDeleting}
            isSelectedForDeletion={selectedForDeletion.has(chapter.id)}
            onToggleSelectForDeletion={onToggleChapterForDeletion}
            onEdit={onEditChapter}
            onUnassign={onUnassignChapter}
            onDeleteClick={onDeleteChapterClick}
          />
        ))}
      </div>
    </div>
  );
}


