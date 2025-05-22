'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListProps, ChapterListChapter, Volume } from '../_types/authorTypes';
import { toast } from 'sonner';
import ChapterBulkUpload from './ChapterBulkUpload';
import * as authorChapterService from '../_services/authorChapterService';
import { VolumeModal, DeleteConfirmationModal, AssignChaptersModal, MassDeleteConfirmationModal } from './ChapterListModals';
import { DefaultCoinsModal, GlobalSettingsModal } from './GlobalPublishing';
import { formatLocalDateTime, isFutureDate } from '@/utils/dateUtils';

const isAdvancedChapter = (chapter: ChapterListChapter): boolean => {
  const now = new Date();
  const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
  
  return (publishDate !== null && publishDate > now) && 
         (chapter.coins !== undefined && chapter.coins > 0);
};

const isExtraChapter = (chapter: ChapterListChapter): boolean => {
  return chapter.part_number === -1;
};

// Utility to check if a chapter is a draft
const isDraftChapter = (chapter: ChapterListChapter) => chapter.chapter_number < 0;

// Utility to check if a chapter is locked indefinitely
const isIndefinitelyLocked = (chapter: ChapterListChapter): boolean => {
  if (!chapter.publish_at) return false;
  const publishDate = new Date(chapter.publish_at);
  const fiftyYearsFromNow = new Date();
  fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
  return publishDate > fiftyYearsFromNow;
};

export default function ChapterList({  chapters,  volumes,  editingChapterId,  onDeleteChapter,  onCreateVolume,  novelId,  userId,  onLoadChapters,  onChapterEdit}: ChapterListProps) {  const [searchQuery, setSearchQuery] = useState('');  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);  const [volumeName, setVolumeName] = useState('');  const [volumeNumber, setVolumeNumber] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; chapterId: string | null }>({
    isOpen: false,
    chapterId: null
  });
  const [deleteVolumeConfirmation, setDeleteVolumeConfirmation] = useState<{ isOpen: boolean; volumeId: string | null }>({
    isOpen: false,
    volumeId: null
  });
  const [isAssignChaptersModalOpen, setIsAssignChaptersModalOpen] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [assigningVolumeId, setAssigningVolumeId] = useState<string | null>(null);
  const [collapsedVolumes, setCollapsedVolumes] = useState<Set<string>>(new Set());
  const [isDefaultCoinsModalOpen, setIsDefaultCoinsModalOpen] = useState(false);
  const [isGlobalSettingsModalOpen, setIsGlobalSettingsModalOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<{
    releaseInterval: number;
    fixedPrice: number;
    autoReleaseEnabled: boolean;
    fixedPriceEnabled: boolean;
    publishingDays: string[];
    usePublishingDays: boolean;
  } | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // State for mass delete
  const [isMassDeleting, setIsMassDeleting] = useState(false);
  const [chaptersToDelete, setChaptersToDelete] = useState<Set<string>>(new Set());
  const [massDeleteConfirmation, setMassDeleteConfirmation] = useState(false);

  const fetchGlobalSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await authorChapterService.getGlobalSettings(novelId, userId);
      const savedDays = localStorage.getItem(`publishingDays_${novelId}`);
      const savedUsePublishingDays = localStorage.getItem(`usePublishingDays_${novelId}`);

      // Ensure we have valid values before updating state
      const newSettings = {
        releaseInterval: settings.autoReleaseInterval || 7,
        fixedPrice: settings.fixedPriceAmount || 10,
        autoReleaseEnabled: Boolean(settings.autoReleaseEnabled),
        fixedPriceEnabled: Boolean(settings.fixedPriceEnabled),
        publishingDays: savedDays ? JSON.parse(savedDays) : [],
        usePublishingDays: savedUsePublishingDays ? JSON.parse(savedUsePublishingDays) : false
      };

      console.log('Fetched global settings:', newSettings); // Debug log
      setGlobalSettings(newSettings);
    } catch (error) {
      console.error('Error fetching global settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to load settings: ${errorMessage}`);
      
      // Set default values on error
      setGlobalSettings({
        releaseInterval: 7,
        fixedPrice: 10,
        autoReleaseEnabled: false,
        fixedPriceEnabled: false,
        publishingDays: [],
        usePublishingDays: false
      });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [novelId, userId]);

  // Ensure settings are refreshed when needed
  useEffect(() => {
    fetchGlobalSettings();
  }, [fetchGlobalSettings, novelId]); // Added novelId as dependency

  const chaptersGroupedByVolume = useMemo(() => {
    // Filter chapters based on search query
    const filteredChapters = chapters.filter(chapter => {
      const searchLower = searchQuery.toLowerCase();
      return (
        chapter.title?.toLowerCase().includes(searchLower) ||
        chapter.chapter_number.toString().includes(searchLower) ||
        (chapter.part_number && chapter.part_number.toString().includes(searchLower))
      );
    });

    const noVolumeChapters = filteredChapters.filter(chapter => !chapter.volume_id);
    const volumeChapters = new Map<string, ChapterListChapter[]>();
    
    volumes.forEach(volume => {
      volumeChapters.set(volume.id, filteredChapters.filter(chapter => chapter.volume_id === volume.id));
    });

    return {
      noVolumeChapters,
      volumeChapters
    };
  }, [chapters, volumes, searchQuery]);

  const handleVolumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVolumeNumber = parseInt(volumeNumber);
    
    if (volumes.some(v => v.volumeNumber === newVolumeNumber)) {
      toast.error('A volume with this number already exists');
      return;
    }

    if (onCreateVolume) {
      onCreateVolume({
        title: volumeName,
        volumeNumber: newVolumeNumber
      });
    }
    setVolumeName('');
    setVolumeNumber('');
    setIsVolumeModalOpen(false);
  };

  // Remove the unused function

  const handleCreateChapter = (volumeId?: string) => {
    if (onChapterEdit) {
      onChapterEdit(undefined, volumeId);
    }
  };

  const handleEditChapter = (chapter: ChapterListChapter) => {
    if (onChapterEdit) {
      onChapterEdit(chapter.id, chapter.volume_id || undefined);
    }
  };

  const handleDeleteClick = (chapterId: string) => {
    setDeleteConfirmation({ isOpen: true, chapterId });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.chapterId) {
      onDeleteChapter(deleteConfirmation.chapterId);
      setDeleteConfirmation({ isOpen: false, chapterId: null });
    }
  };

  const handleDeleteVolume = async (volumeId: string) => {
    try {
      await authorChapterService.deleteVolume(volumeId, novelId, userId);
      if (onLoadChapters) {
        await onLoadChapters();
      }
      toast.success('Volume deleted successfully');
    } catch (error) {
      console.error('Error deleting volume:', error);
      toast.error('Failed to delete volume');
    }
  };

  const handleAssignChaptersClick = (volumeId: string) => {
    setAssigningVolumeId(volumeId);
    setSelectedChapterIds(new Set());
    setIsAssignChaptersModalOpen(true);
  };

  const handleAssignChapters = async () => {
    if (!assigningVolumeId) return;

    try {
      await authorChapterService.assignChaptersToVolume(
        Array.from(selectedChapterIds),
        assigningVolumeId,
        novelId,
        userId
      );
      if (onLoadChapters) {
        await onLoadChapters();
      }
      toast.success('Chapters assigned successfully');
      setIsAssignChaptersModalOpen(false);
    } catch (error) {
      console.error('Error assigning chapters:', error);
      toast.error('Failed to assign chapters');
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    const newSelection = new Set(selectedChapterIds);
    if (newSelection.has(chapterId)) {
      newSelection.delete(chapterId);
    } else {
      newSelection.add(chapterId);
    }
    setSelectedChapterIds(newSelection);
  };

  const toggleVolumeCollapse = (volumeId: string) => {
    const newCollapsed = new Set(collapsedVolumes);
    if (newCollapsed.has(volumeId)) {
      newCollapsed.delete(volumeId);
    } else {
      newCollapsed.add(volumeId);
    }
    setCollapsedVolumes(newCollapsed);
  };

  const handleUnassignChapter = async (chapterId: string) => {
    try {
      await authorChapterService.assignChaptersToVolume(
        [chapterId],
        null,
        novelId,
        userId
      );
      if (onLoadChapters) {
        await onLoadChapters();
      }
      toast.success('Chapter unassigned successfully');
    } catch (error) {
      console.error('Error unassigning chapter:', error);
      toast.error('Failed to unassign chapter');
    }
  };

  const handleDefaultCoinsSubmit = async (coins: number) => {
    try {
      await authorChapterService.updateAdvancedChapterCoins(novelId, userId, coins);
      if (onLoadChapters) {
        await onLoadChapters();
      }
      toast.success('Default coins updated successfully');
    } catch (error) {
      console.error('Error updating default coins:', error);
      toast.error('Failed to update default coins');
    }
  };

  const handleGlobalSettingsSubmit = async (settings: {
    releaseInterval: number;
    fixedPrice: number;
    autoReleaseEnabled: boolean;
    fixedPriceEnabled: boolean;
    publishingDays: string[];
    usePublishingDays: boolean;
  }) => {
    setIsSavingSettings(true);
    try {
      console.log('Saving global settings:', settings); // Debug log
      
      // Only update database fields
      await authorChapterService.updateGlobalSettings(novelId, userId, {
        autoReleaseEnabled: settings.autoReleaseEnabled,
        autoReleaseInterval: settings.releaseInterval,
        fixedPriceEnabled: settings.fixedPriceEnabled,
        fixedPriceAmount: settings.fixedPrice
      });
      
      // Update local state immediately after successful save
      setGlobalSettings(settings);
      
      // Close the modal
      setIsGlobalSettingsModalOpen(false);
      
      if (onLoadChapters) {
        await onLoadChapters();
      }
      
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update settings: ${errorMessage}`);
      // Refresh settings from server on error
      await fetchGlobalSettings();
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenGlobalSettings = () => {
    // No need to fetch settings here since they're already loaded
    setIsGlobalSettingsModalOpen(true);
  };

  const toggleChapterForDeletion = (chapterId: string) => {
    setChaptersToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleMassDeleteChapters = async () => {
    try {
      // Using a for...of loop to ensure sequential deletion or if you need to await each deletion
      for (const chapterId of chaptersToDelete) {
        // Assuming onDeleteChapter is synchronous or you don't need to wait for each one individually.
        // If onDeleteChapter is async and you need to wait, then: await onDeleteChapter(chapterId);
        onDeleteChapter(chapterId);
      }
      toast.success(`${chaptersToDelete.size} chapters deleted successfully`);
      setChaptersToDelete(new Set());
      setIsMassDeleting(false);
      setMassDeleteConfirmation(false);
      if (onLoadChapters) {
        await onLoadChapters(); // Refresh chapter list
      }
    } catch (error) {
      console.error('Error deleting chapters in bulk:', error);
      toast.error('Failed to delete some chapters.');
    }
  };

  const renderChapter = (chapter: ChapterListChapter) => (
    <div
      key={chapter.id}
      className={`relative group ${editingChapterId === chapter.id 
          ? 'bg-primary/10 hover:bg-primary/20' 
          : 'hover:bg-accent/50'
      } ${isMassDeleting ? 'pl-10' : ''}` // Add padding for checkbox
    }>
      {isMassDeleting && (
        <div className="absolute top-1/2 left-3 -translate-y-1/2">
          <input 
            type="checkbox"
            checked={chaptersToDelete.has(chapter.id)}
            onChange={() => toggleChapterForDeletion(chapter.id)}
            className="form-checkbox h-4 w-4 text-primary rounded border-border focus:ring-primary/50 cursor-pointer"
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
          />
        </div>
      )}
      <div 
        onClick={() => !isMassDeleting && handleEditChapter(chapter)} // Only allow edit if not mass deleting
        className="p-3 sm:p-4 cursor-pointer"
      >
        <div className="flex flex-col gap-1 pr-20">
          <div className="flex-1">
            <h4 className="font-medium text-foreground text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditChapter(chapter);
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
                    <span className="text-muted-foreground">
                      {" "}Part {chapter.part_number}
                    </span>
                  )}
                </>
              )}
              {chapter.title && (
                <span className="text-muted-foreground ml-1">: {chapter.title}</span>
              )}
            </h4>
            {chapter.publish_at && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                {isIndefinitelyLocked(chapter) ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                    <Icon icon="mdi:lock-clock" className="w-4 h-4" />
                    Locked Indefinitely
                  </span>
                ) : (
                  isFutureDate(chapter.publish_at)
                    ? `Scheduled: ${formatLocalDateTime(chapter.publish_at)}`
                    : `Published: ${formatLocalDateTime(chapter.publish_at)}`
                )}
                {isAdvancedChapter(chapter) && (
                  <>
                    <span className="inline-flex items-center gap-1 text-primary">
                      {chapter.coins}c
                    </span>
                    <span className="text-primary">Advanced</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-1 sm:top-2 sm:right-2 flex items-center gap-1">
        {chapter.volume_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnassignChapter(chapter.id);
            }}
            className="px-2 py-0.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Unassign
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(chapter.id);
          }}
          className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
          title="Delete chapter"
        >
          <Icon icon="mdi:delete-outline" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderVolumeSection = (volume: Volume) => {
    const volumeChapters = chaptersGroupedByVolume.volumeChapters.get(volume.id) || [];
    const isCollapsed = collapsedVolumes.has(volume.id);

    return (
      <div key={volume.id} className="border-t border-border first:border-t-0">
        <div className="bg-accent/50 px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleVolumeCollapse(volume.id)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              aria-label={isCollapsed ? "Expand volume" : "Collapse volume"}
            >
              <Icon 
                icon={isCollapsed ? "mdi:chevron-right" : "mdi:chevron-down"} 
                className="w-4 h-4"
              />
            </button>
            <h3 className="text-sm font-medium text-foreground">
              Volume {volume.volumeNumber}{volume.title ? `: ${volume.title}` : ''}
            </h3>
            <button
              onClick={() => setDeleteVolumeConfirmation({ isOpen: true, volumeId: volume.id })}
              className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
              title="Delete volume"
            >
              <Icon icon="mdi:delete-outline" className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAssignChaptersClick(volume.id)}
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
                if (onLoadChapters) {
                  onLoadChapters();
                }
              }}
            />
            <button
              onClick={() => handleCreateChapter(volume.id)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
            >
              <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
              Add Chapter
            </button>
          </div>
        </div>
        <div className={`divide-y divide-border ${isCollapsed ? 'hidden' : ''}`}>
          {volumeChapters
            .sort((a, b) => {
              if (a.chapter_number !== b.chapter_number) {
                return a.chapter_number - b.chapter_number;
              }
              // If chapter numbers are equal, sort by part number
              const partA = a.part_number || 0;
              const partB = b.part_number || 0;
              return partA - partB;
            })
            .map(renderChapter)}
        </div>
      </div>
    );
  };

  // Sort function that puts extra chapters first
  const sortChapters = useCallback((a: ChapterListChapter, b: ChapterListChapter) => {
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
  }, []);

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-accent/50 p-2 sm:p-3 border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateChapter()}
                className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
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
            </div>
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full pl-8 pr-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
                <Icon 
                  icon="mdi:magnify"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMassDeleting && chaptersToDelete.size > 0 && (
                 <button
                  onClick={() => setMassDeleteConfirmation(true)}
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
                >
                  <Icon icon="mdi:delete-sweep-outline" className="w-4 h-4 mr-1.5" />
                  Delete Selected ({chaptersToDelete.size})
                </button>
              )}
              {!isMassDeleting && (
                <button
                  onClick={() => setIsVolumeModalOpen(true)}
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                >
                  Add Volume
                </button>
              )}
              <button
                onClick={() => setIsMassDeleting(prev => !prev)}
                className={`inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${isMassDeleting ? 'bg-red-500/20 text-red-700 dark:text-red-400' : ''}`}
              >
                {isMassDeleting ? 'Cancel Delete' : 'Delete Chapters'}
              </button>
              <button
                onClick={handleOpenGlobalSettings}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                title="Chapter Settings"
              >
                <Icon icon="mdi:cog" className="w-5 h-5" />
              </button>
              <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide flex-1">
          {volumes.map(renderVolumeSection)}

          {chaptersGroupedByVolume.noVolumeChapters.length > 0 && (
            <div className="border-t border-border mt-4">
              <div className="bg-accent/50 px-3 py-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-foreground">
                  Unassigned Chapters
                </h3>
                <button
                  onClick={() => handleCreateChapter()}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
                >
                  <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
                  Add Chapter
                </button>
              </div>
              <div className="divide-y divide-border mt-2">
                {chaptersGroupedByVolume.noVolumeChapters
                  .sort(sortChapters)
                  .map(renderChapter)}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <VolumeModal
          isOpen={isVolumeModalOpen}
          volumeName={volumeName}
          volumeNumber={volumeNumber}
          onClose={() => setIsVolumeModalOpen(false)}
          onSubmit={handleVolumeSubmit}
          onVolumeNameChange={setVolumeName}
          onVolumeNumberChange={setVolumeNumber}
        />

        <DeleteConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, chapterId: null })}
          onConfirm={handleConfirmDelete}
          title="Delete Chapter"
          message="Are you sure you want to delete this chapter? This action cannot be undone."
        />

        <DeleteConfirmationModal
          isOpen={deleteVolumeConfirmation.isOpen}
          onClose={() => setDeleteVolumeConfirmation({ isOpen: false, volumeId: null })}
          onConfirm={() => {
            if (deleteVolumeConfirmation.volumeId) {
              handleDeleteVolume(deleteVolumeConfirmation.volumeId);
              setDeleteVolumeConfirmation({ isOpen: false, volumeId: null });
            }
          }}
          title="Delete Volume"
          message="Are you sure you want to delete this volume? All chapters in this volume will be unassigned. This action cannot be undone."
        />

        <MassDeleteConfirmationModal
          isOpen={massDeleteConfirmation}
          onClose={() => setMassDeleteConfirmation(false)}
          onConfirm={handleMassDeleteChapters}
          numberOfChaptersToDelete={chaptersToDelete.size}
        />

        <DefaultCoinsModal
          isOpen={isDefaultCoinsModalOpen}
          onClose={() => setIsDefaultCoinsModalOpen(false)}
          onSubmit={handleDefaultCoinsSubmit}
        />

        <GlobalSettingsModal
          isOpen={isGlobalSettingsModalOpen}
          onClose={() => setIsGlobalSettingsModalOpen(false)}
          onSubmit={handleGlobalSettingsSubmit}
          initialSettings={globalSettings || {
            releaseInterval: 7,
            fixedPrice: 10,
            autoReleaseEnabled: false,
            fixedPriceEnabled: false,
            publishingDays: [],
            usePublishingDays: false
          }}
          isLoading={isLoadingSettings}
          isSaving={isSavingSettings}
          novelId={novelId}
        />

        <AssignChaptersModal
          isOpen={isAssignChaptersModalOpen}
          onClose={() => setIsAssignChaptersModalOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          chapters={chapters.filter(chapter => chapter.volume_id !== assigningVolumeId)}
          selectedChapterIds={selectedChapterIds}
          toggleChapterSelection={toggleChapterSelection}
          onAssign={handleAssignChapters}
        />
      </div>
    </div>
  );
}