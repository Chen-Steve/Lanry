import React from 'react';
import { Icon } from '@iconify/react';
import { ChapterListChapter } from '../_types/authorTypes';

interface VolumeModalProps {
  isOpen: boolean;
  volumeName: string;
  volumeNumber: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onVolumeNameChange: (value: string) => void;
  onVolumeNumberChange: (value: string) => void;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

interface MassDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  numberOfChaptersToDelete: number;
}

interface AssignChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  chapters: ChapterListChapter[];
  selectedChapterIds: Set<string>;
  toggleChapterSelection: (chapterId: string) => void;
  onAssign: () => void;
}

export function VolumeModal({
  isOpen,
  volumeName,
  volumeNumber,
  onClose,
  onSubmit,
  onVolumeNameChange,
  onVolumeNumberChange
}: VolumeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
        <h3 className="text-lg font-medium text-foreground mb-4">Create New Volume</h3>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="volumeNumber" className="block text-sm font-medium text-foreground mb-1">
                Volume Number
              </label>
              <input
                type="number"
                id="volumeNumber"
                value={volumeNumber}
                onChange={(e) => onVolumeNumberChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Enter volume number"
                required
                min="1"
              />
            </div>
            <div>
              <label htmlFor="volumeName" className="block text-sm font-medium text-foreground mb-1">
                Volume Title (Optional)
              </label>
              <input
                type="text"
                id="volumeName"
                value={volumeName}
                onChange={(e) => onVolumeNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Enter volume title"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Create Volume
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-sm border border-border shadow-lg">
        <h3 className="text-lg font-medium text-foreground mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function MassDeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  numberOfChaptersToDelete
}: MassDeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <DeleteConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Selected Chapters"
      message={`Are you sure you want to delete ${numberOfChaptersToDelete} selected ${numberOfChaptersToDelete === 1 ? 'chapter' : 'chapters'}? This action cannot be undone.`}
    />
  );
}

export function AssignChaptersModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  chapters,
  selectedChapterIds,
  toggleChapterSelection,
  onAssign
}: AssignChaptersModalProps) {
  if (!isOpen) return null;

  // Sort chapters to show extras first
  const sortedChapters = [...chapters].sort((a, b) => {
    // If one is an extra chapter and the other isn't, sort extra chapter first
    if (a.part_number === -1 && b.part_number !== -1) return -1;
    if (a.part_number !== -1 && b.part_number === -1) return 1;
    
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
  });

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-2xl border border-border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Assign Chapters to Volume</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chapters..."
            className="w-full px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto border border-border rounded-md divide-y divide-border">
          {sortedChapters
            .filter(chapter => {
              const searchLower = searchQuery.toLowerCase();
              return (
                chapter.title?.toLowerCase().includes(searchLower) ||
                chapter.chapter_number.toString().includes(searchLower) ||
                (chapter.part_number && chapter.part_number.toString().includes(searchLower))
              );
            })
            .map(chapter => (
              <div
                key={chapter.id}
                className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => toggleChapterSelection(chapter.id)}
              >
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedChapterIds.has(chapter.id)}
                    onChange={() => toggleChapterSelection(chapter.id)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background"
                    aria-label={`Select Chapter ${chapter.chapter_number}${chapter.part_number ? ` Part ${chapter.part_number}` : ''}`}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {chapter.part_number === -1 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon icon="solar:star-bold" className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-purple-500">
                          Ch. {chapter.chapter_number} · Extra:
                        </span>
                        <span className="text-purple-500">{chapter.title}</span>
                      </span>
                    ) : (
                      <>
                        Chapter {chapter.chapter_number}
                        {chapter.part_number && chapter.part_number !== -1 && (
                          <span className="text-muted-foreground">
                            {" "}Part {chapter.part_number}
                          </span>
                        )}
                        {chapter.title && (
                          <span className="text-muted-foreground ml-1">: {chapter.title}</span>
                        )}
                      </>
                    )}
                  </h4>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={selectedChapterIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Assign {selectedChapterIds.size} {selectedChapterIds.size === 1 ? 'Chapter' : 'Chapters'}
          </button>
        </div>
      </div>
    </div>
  );
} 