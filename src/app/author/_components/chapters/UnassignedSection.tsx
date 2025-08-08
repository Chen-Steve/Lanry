"use client";

import { Icon } from "@iconify/react";
import { ChapterListChapter } from "../../_types/authorTypes";
import ChapterRow from "./ChapterRow";

interface UnassignedSectionProps {
  chapters: ChapterListChapter[];
  onCreateChapter: () => void;
  onEditChapter: (chapter: ChapterListChapter) => void;
  onDeleteChapterClick: (chapterId: string) => void;
  onToggleChapterForDeletion: (chapterId: string) => void;
  isMassDeleting: boolean;
  selectedForDeletion: Set<string>;
  highlightedChapterId?: string;
}

export default function UnassignedSection({
  chapters,
  onCreateChapter,
  onEditChapter,
  onDeleteChapterClick,
  onToggleChapterForDeletion,
  isMassDeleting,
  selectedForDeletion,
  highlightedChapterId,
}: UnassignedSectionProps) {
  if (chapters.length === 0) return null;
  return (
    <div className="border-t border-border mt-4">
      <div className="bg-accent/50 px-3 py-2 flex justify-between items-center">
        <h3 className="text-sm font-medium text-foreground">Unassigned Chapters</h3>
        <button
          onClick={onCreateChapter}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
        >
          <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
          Add Chapter
        </button>
      </div>
      <div className="divide-y divide-border mt-2">
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            isHighlighted={highlightedChapterId === chapter.id}
            isMassDeleting={isMassDeleting}
            isSelectedForDeletion={selectedForDeletion.has(chapter.id)}
            onToggleSelectForDeletion={onToggleChapterForDeletion}
            onEdit={onEditChapter}
            onDeleteClick={onDeleteChapterClick}
          />
        ))}
      </div>
    </div>
  );
}


