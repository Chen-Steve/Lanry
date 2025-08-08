"use client";

import { useCallback, useEffect, useState } from "react";
import * as authorChapterService from "../../../_services/authorChapterService";
import { toast } from "sonner";

export interface ChapterSettingsState {
  releaseInterval: number;
  fixedPrice: number;
  autoReleaseEnabled: boolean;
  fixedPriceEnabled: boolean;
  publishingDays: string[];
  usePublishingDays: boolean;
}

export function useChapterSettings(novelId: string, userId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ChapterSettingsState | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = await authorChapterService.getGlobalSettings(novelId, userId);
      const savedDays = localStorage.getItem(`publishingDays_${novelId}`);
      const savedUsePublishingDays = localStorage.getItem(`usePublishingDays_${novelId}`);
      setSettings({
        releaseInterval: s.autoReleaseInterval || 7,
        fixedPrice: s.fixedPriceAmount || 10,
        autoReleaseEnabled: Boolean(s.autoReleaseEnabled),
        fixedPriceEnabled: Boolean(s.fixedPriceEnabled),
        publishingDays: savedDays ? JSON.parse(savedDays) : [],
        usePublishingDays: savedUsePublishingDays ? JSON.parse(savedUsePublishingDays) : false,
      });
    } catch (error) {
      console.error("Error fetching global settings:", error);
      toast.error("Failed to load settings");
      setSettings({
        releaseInterval: 7,
        fixedPrice: 10,
        autoReleaseEnabled: false,
        fixedPriceEnabled: false,
        publishingDays: [],
        usePublishingDays: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [novelId, userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(async (next: ChapterSettingsState) => {
    setIsSaving(true);
    try {
      await authorChapterService.updateGlobalSettings(novelId, userId, {
        autoReleaseEnabled: next.autoReleaseEnabled,
        autoReleaseInterval: next.releaseInterval,
        fixedPriceEnabled: next.fixedPriceEnabled,
        fixedPriceAmount: next.fixedPrice,
      });
      setSettings(next);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
      await fetchSettings();
    } finally {
      setIsSaving(false);
    }
  }, [novelId, userId, fetchSettings]);

  return { settings, isLoading, isSaving, fetchSettings, saveSettings, setSettings };
}


