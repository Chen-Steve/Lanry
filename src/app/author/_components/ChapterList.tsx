'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListProps, ChapterListChapter } from '../_types/authorTypes';
import { toast } from 'react-hot-toast';
import ChapterEditForm from './ChapterEditForm';
import ChapterBulkUpload from './ChapterBulkUpload';
import * as authorChapterService from '../_services/authorChapterService';
import { VolumeModal, DeleteConfirmationModal, AssignChaptersModal } from './ChapterListModals';
import VolumeSection from './VolumeSection';
import ChapterListItem from './ChapterListItem';
import ChapterPublishSettings from './ChapterPublishSettings';
import { AutoScheduleSettings } from '../_services/authorChapterService';

export default function ChapterList({
  chapters,
  volumes,
  editingChapterId,
  onDeleteChapter,
  onCreateVolume,
  onCreateChapter,
  novelId,
  userId,
  onLoadChapters
}: ChapterListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [volumeName, setVolumeName] = useState('');
  const [volumeNumber, setVolumeNumber] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | undefined>();
  const [editingChapter, setEditingChapter] = useState<ChapterListChapter | null>(null);
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
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [autoScheduleSettings, setAutoScheduleSettings] = useState<AutoScheduleSettings>({
    enabled: false,
    interval: 7,
    scheduleTime: '12:00',
    startDate: ''
  });
  const [publishSettings, setPublishSettings] = useState({
    publishAt: '',
    coins: '0'
  });

  useEffect(() => {
    const loadAutoScheduleSettings = async () => {
      try {
        const settings = await authorChapterService.fetchAutoScheduleSettings(novelId, userId);
        setAutoScheduleSettings(settings);
      } catch (error) {
        console.error('Error loading auto-schedule settings:', error);
        toast.error('Failed to load auto-schedule settings');
      }
    };

    loadAutoScheduleSettings();
  }, [novelId, userId]);

  const chaptersGroupedByVolume = useMemo(() => {
    const noVolumeChapters = chapters.filter(chapter => !chapter.volumeId);
    const volumeChapters = new Map<string, ChapterListChapter[]>();
    
    volumes.forEach(volume => {
      volumeChapters.set(volume.id, chapters.filter(chapter => chapter.volumeId === volume.id));
    });

    return {
      noVolumeChapters,
      volumeChapters
    };
  }, [chapters, volumes]);

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

  const handleCreateChapter = (volumeId?: string) => {
    setSelectedVolumeId(volumeId);
    setEditingChapter(null);
    setShowChapterForm(true);
    if (onCreateChapter) {
      onCreateChapter(volumeId);
    }
  };

  const handleEditChapter = (chapter: ChapterListChapter) => {
    setSelectedVolumeId(chapter.volumeId || undefined);
    setEditingChapter(chapter);
    setShowChapterForm(true);
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

  const handleAutoScheduleChange = async (settings: AutoScheduleSettings) => {
    setAutoScheduleSettings({
      enabled: settings.enabled,
      interval: settings.interval,
      scheduleTime: settings.scheduleTime || '12:00',
      startDate: settings.startDate || ''
    });
    
    try {
      await authorChapterService.saveAutoScheduleSettings(novelId, userId, settings);
      
      if (settings.enabled) {
        toast.success('Auto-scheduling enabled');
      }
    } catch (error) {
      console.error('Error saving auto-schedule settings:', error);
      toast.error('Failed to save auto-schedule settings');
      
      setAutoScheduleSettings(prev => ({
        ...prev,
        enabled: !settings.enabled,
        startDate: prev.startDate
      }));
    }
  };

  const handlePublishSettingsChange = (settings: { publishAt: string; coins: string }) => {
    setPublishSettings(settings);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
      {showChapterForm ? (
        <ChapterEditForm
          novelId={novelId}
          userId={userId}
          chapterId={editingChapter?.id}
          volumeId={selectedVolumeId}
          autoScheduleEnabled={autoScheduleSettings.enabled}
          autoScheduleInterval={autoScheduleSettings.interval}
          autoScheduleTime={autoScheduleSettings.scheduleTime}
          autoScheduleStartDate={autoScheduleSettings.startDate}
          onCancel={() => {
            setShowChapterForm(false);
            setEditingChapter(null);
          }}
          onSave={() => {
            setShowChapterForm(false);
            setEditingChapter(null);
            if (onCreateChapter && !editingChapter) {
              onCreateChapter(selectedVolumeId);
            }
            if (onLoadChapters) {
              onLoadChapters();
            }
          }}
        />
      ) : (
        <div className="flex flex-col h-full">
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
                <div className="relative flex-1 max-w-md">
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
                <button
                  onClick={() => setIsVolumeModalOpen(true)}
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                >
                  Add Volume
                </button>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScheduleSettings.enabled}
                      onChange={(e) => handleAutoScheduleChange({
                        enabled: e.target.checked,
                        interval: autoScheduleSettings.interval,
                        scheduleTime: autoScheduleSettings.scheduleTime,
                        startDate: autoScheduleSettings.startDate
                      })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className={autoScheduleSettings.enabled ? 'text-primary' : ''}>Auto Schedule</span>
                  </label>
                  <button
                    onClick={() => setShowScheduleSettings(true)}
                    className="inline-flex items-center justify-center w-8 h-8 text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    title="Configure auto schedule settings"
                  >
                    <Icon icon="mdi:cog" className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                  {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto scrollbar-hide flex-1">
            {volumes.map(volume => (
              <VolumeSection
                key={volume.id}
                volume={volume}
                chapters={chaptersGroupedByVolume.volumeChapters.get(volume.id) || []}
                editingChapterId={editingChapterId}
                isCollapsed={collapsedVolumes.has(volume.id)}
                onToggleCollapse={toggleVolumeCollapse}
                onDeleteVolume={() => setDeleteVolumeConfirmation({ isOpen: true, volumeId: volume.id })}
                onAssignChapters={handleAssignChaptersClick}
                onCreateChapter={handleCreateChapter}
                onEditChapter={handleEditChapter}
                onDeleteChapter={handleDeleteClick}
                onUnassignChapter={handleUnassignChapter}
              />
            ))}

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
                    .sort((a, b) => a.chapter_number - b.chapter_number)
                    .map(chapter => (
                      <ChapterListItem
                        key={chapter.id}
                        chapter={chapter}
                        editingChapterId={editingChapterId}
                        onEditChapter={handleEditChapter}
                        onDeleteClick={handleDeleteClick}
                      />
                    ))}
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

          <AssignChaptersModal
            isOpen={isAssignChaptersModalOpen}
            onClose={() => setIsAssignChaptersModalOpen(false)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            chapters={chaptersGroupedByVolume.noVolumeChapters}
            selectedChapterIds={selectedChapterIds}
            toggleChapterSelection={toggleChapterSelection}
            onAssign={handleAssignChapters}
          />

          {showScheduleSettings && (
            <ChapterPublishSettings
              publishAt={publishSettings.publishAt}
              coins={publishSettings.coins}
              onSettingsChange={handlePublishSettingsChange}
              autoScheduleInterval={autoScheduleSettings.interval}
              useAutoSchedule={autoScheduleSettings.enabled}
              autoScheduleTime={autoScheduleSettings.scheduleTime}
              autoScheduleStartDate={autoScheduleSettings.startDate}
              onAutoScheduleChange={handleAutoScheduleChange}
              showSchedulePopup={showScheduleSettings}
              onCloseSchedulePopup={() => setShowScheduleSettings(false)}
            />
          )}
        </div>
      )}
    </div>
  );
} 