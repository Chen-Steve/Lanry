"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useChapterSelection(
  onDeleteChapter: (chapterId: string) => void | Promise<void>,
  onLoadChapters?: () => void | Promise<void>
) {
  const [isMassDeleting, setIsMassDeleting] = useState(false);
  const [chaptersToDelete, setChaptersToDelete] = useState<Set<string>>(new Set());
  const [massDeleteConfirmation, setMassDeleteConfirmation] = useState(false);

  const toggleChapterForDeletion = useCallback((chapterId: string) => {
    setChaptersToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }, []);

  const openMassDeleteConfirmation = useCallback(() => setMassDeleteConfirmation(true), []);
  const closeMassDeleteConfirmation = useCallback(() => setMassDeleteConfirmation(false), []);

  const toggleMassDeleting = useCallback(() => setIsMassDeleting((p) => !p), []);

  const confirmMassDelete = useCallback(async () => {
    try {
      for (const chapterId of chaptersToDelete) {
        await onDeleteChapter(chapterId);
      }
      toast.success(`${chaptersToDelete.size} chapters deleted successfully`);
      setChaptersToDelete(new Set());
      setIsMassDeleting(false);
      setMassDeleteConfirmation(false);
      if (onLoadChapters) await onLoadChapters();
    } catch (error) {
      console.error('Error deleting chapters in bulk:', error);
      toast.error('Failed to delete some chapters.');
    }
  }, [chaptersToDelete, onDeleteChapter, onLoadChapters]);

  return {
    isMassDeleting,
    toggleMassDeleting,
    chaptersToDelete,
    toggleChapterForDeletion,
    massDeleteConfirmation,
    openMassDeleteConfirmation,
    closeMassDeleteConfirmation,
    confirmMassDelete,
    canConfirmMassDelete: chaptersToDelete.size > 0,
  };
}


