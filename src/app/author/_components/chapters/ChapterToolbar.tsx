"use client";

import { Icon } from "@iconify/react";
import ChapterBulkUpload from "../ChapterBulkUpload";

interface ChapterToolbarProps {
  novelId: string;
  userId: string;
  onLoadChapters?: () => void | Promise<void>;
  onCreateChapter: () => void;
  onOpenVolumeModal: () => void;
  onToggleSortOrder: () => void;
  isDescending: boolean;
  isMassDeleting: boolean;
  onToggleMassDeleting: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  chapterCount: number;
  canConfirmMassDelete: boolean;
  onOpenMassDeleteConfirm: () => void;
  onOpenGlobalSettings: () => void;
}

export default function ChapterToolbar({
  novelId,
  userId,
  onLoadChapters,
  onCreateChapter,
  onOpenVolumeModal,
  onToggleSortOrder,
  isDescending,
  isMassDeleting,
  onToggleMassDeleting,
  searchQuery,
  onSearchChange,
  chapterCount,
  canConfirmMassDelete,
  onOpenMassDeleteConfirm,
  onOpenGlobalSettings,
}: ChapterToolbarProps) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onCreateChapter}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors min-h-[36px] sm:min-h-[40px]"
          >
            Add Chapter
          </button>
          <ChapterBulkUpload
            novelId={novelId}
            userId={userId}
            onUploadComplete={() => {
              if (onLoadChapters) {
                onLoadChapters();
              }
            }}
          />
          {!isMassDeleting && (
            <>
              <button
                onClick={onOpenVolumeModal}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors min-h-[36px] sm:min-h-[40px]"
              >
                Add Volume
              </button>
              <button
                onClick={onToggleSortOrder}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors min-h-[36px] sm:min-h-[40px]"
                title={isDescending ? "Oldest → Newest" : "Newest → Oldest"}
                aria-label="Flip chapter order"
              >
                <Icon icon={isDescending ? "mdi:sort-ascending" : "mdi:sort-descending"} className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onToggleMassDeleting}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors min-h-[36px] sm:min-h-[40px] ${isMassDeleting ? 'bg-red-500/20 text-red-700 dark:text-red-400' : 'text-foreground'}`}
          >
            {isMassDeleting ? 'Cancel Delete' : 'Delete Chapters'}
          </button>
          <button
            onClick={onOpenGlobalSettings}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
            title="Chapter Settings"
            aria-label="Chapter Settings"
          >
            <Icon icon="mdi:cog" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chapters..."
              className="w-full pl-8 pr-8 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors min-h-[36px] sm:min-h-[40px]"
            />
            <Icon
              icon="mdi:magnify"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent/60"
              >
                <Icon icon="mdi:close" className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">
            {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
          </span>
        </div>
        {isMassDeleting && canConfirmMassDelete && (
          <button
            onClick={onOpenMassDeleteConfirm}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors w-full sm:w-auto"
          >
            <Icon icon="mdi:delete-sweep-outline" className="w-4 h-4 mr-1.5" />
            Delete Selected
          </button>
        )}
      </div>
      <div className="sm:hidden mt-1 text-xs text-muted-foreground">
        {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
      </div>
    </>
  );
}


