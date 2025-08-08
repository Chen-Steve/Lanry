"use client";

import { useCallback, useState } from "react";
import { Volume } from "../../../_types/authorTypes";
import * as authorChapterService from "../../../_services/authorChapterService";
import { toast } from "sonner";

export function useVolumeEditing(novelId: string, userId: string, onLoadChapters?: () => void | Promise<void>) {
  const [editingVolumeId, setEditingVolumeId] = useState<string | null>(null);
  const [editingVolumeTitle, setEditingVolumeTitle] = useState("");

  const beginEdit = useCallback((volume: Volume) => {
    setEditingVolumeId(volume.id);
    setEditingVolumeTitle(volume.title || "");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingVolumeId(null);
    setEditingVolumeTitle("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingVolumeId || !editingVolumeTitle.trim()) return;
    try {
      await authorChapterService.updateVolume(editingVolumeId, novelId, userId, { title: editingVolumeTitle.trim() });
      if (onLoadChapters) await onLoadChapters();
      toast.success("Volume updated successfully");
      setEditingVolumeId(null);
      setEditingVolumeTitle("");
    } catch (error) {
      console.error("Error updating volume:", error);
      toast.error("Failed to update volume");
    }
  }, [editingVolumeId, editingVolumeTitle, novelId, userId, onLoadChapters]);

  return { editingVolumeId, editingVolumeTitle, setEditingVolumeTitle, beginEdit, cancelEdit, saveEdit };
}


