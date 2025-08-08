"use client";

import { Icon } from "@iconify/react";
import { ChapterListChapter } from "../../_types/authorTypes";
import { formatLocalDateTime, isFutureDate } from "@/utils/dateUtils";
import React from "react";

const isExtraChapter = (chapter: ChapterListChapter): boolean => chapter.part_number === -1;
const isDraftChapter = (chapter: ChapterListChapter) => chapter.chapter_number < 0;
const isIndefinitelyLocked = (chapter: ChapterListChapter): boolean => {
  if (!chapter.publish_at) return false;
  const publishDate = new Date(chapter.publish_at);
  const fiftyYearsFromNow = new Date();
  fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
  return publishDate > fiftyYearsFromNow;
};

interface ChapterRowProps {
  chapter: ChapterListChapter;
  isHighlighted: boolean;
  isMassDeleting: boolean;
  isSelectedForDeletion: boolean;
  onToggleSelectForDeletion: (chapterId: string) => void;
  onEdit: (chapter: ChapterListChapter) => void;
  onUnassign?: (chapterId: string) => void;
  onDeleteClick: (chapterId: string) => void;
}

export default function ChapterRow({
  chapter,
  isHighlighted,
  isMassDeleting,
  isSelectedForDeletion,
  onToggleSelectForDeletion,
  onEdit,
  onUnassign,
  onDeleteClick,
}: ChapterRowProps) {
  return (
    <div
      key={chapter.id}
      className={`relative group ${
        isHighlighted ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-accent/50"
      } ${isMassDeleting ? "pl-10" : ""}`}
    >
      {isMassDeleting && (
        <div className="absolute top-1/2 left-3 -translate-y-1/2">
          <input
            type="checkbox"
            checked={isSelectedForDeletion}
            onChange={() => onToggleSelectForDeletion(chapter.id)}
            className="form-checkbox h-4 w-4 text-primary rounded border-border focus:ring-primary/50 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div onClick={() => !isMassDeleting && onEdit(chapter)} className="p-3 sm:p-4 cursor-pointer">
        <div className="flex flex-col gap-1 pr-20">
          <div className="flex-1">
            <h4 className="font-medium text-foreground text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(chapter);
                }}
                className="mr-2 px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
              >
                Edit
              </button>
              {isExtraChapter(chapter) ? (
                <span className="inline-flex items-center gap-1">
                  <Icon icon="material-symbols:star-rounded" className="w-4 h-4 text-purple-500" />
                  Extra
                </span>
              ) : (
                <>
                  Chapter {Math.abs(chapter.chapter_number)}
                  {isDraftChapter(chapter) && (
                    <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 rounded">
                      <Icon icon="mdi:pencil" className="w-3.5 h-3.5" /> Draft
                    </span>
                  )}
                  {chapter.part_number && chapter.part_number !== -1 && (
                    <span className="text-muted-foreground"> Part {chapter.part_number}</span>
                  )}
                </>
              )}
              {chapter.title && <span className="text-muted-foreground ml-1">: {chapter.title}</span>}
            </h4>
            {chapter.publish_at && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                {isIndefinitelyLocked(chapter) ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                    <Icon icon="mdi:lock-clock" className="w-4 h-4" /> Locked Indefinitely
                  </span>
                ) : isFutureDate(chapter.publish_at) ? (
                  <>Scheduled: {formatLocalDateTime(chapter.publish_at)}</>
                ) : (
                  <>Published: {formatLocalDateTime(chapter.publish_at)}</>
                )}
                {chapter.coins !== undefined && chapter.coins > 0 && (
                  <>
                    <span className="inline-flex items-center gap-1 text-primary">{chapter.coins}c</span>
                    <span className="text-primary">Advanced</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-1 sm:top-2 sm:right-2 flex items-center gap-1">
        {chapter.volume_id && onUnassign && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnassign(chapter.id);
            }}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Unassign
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(chapter.id);
          }}
          className="p-1.5 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
          title="Delete chapter"
        >
          <Icon icon="mdi:delete-outline" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


