'use client';

import React, { useState, useEffect } from 'react';
import { ChapterListProps, ChapterListChapter, Volume } from '../_types/authorTypes';
import { toast } from 'sonner';
import * as authorChapterService from '../_services/authorChapterService';
import { VolumeModal, DeleteConfirmationModal, AssignChaptersModal, MassDeleteConfirmationModal } from './ChapterListModals';
import ChapterToolbar from './chapters/ChapterToolbar';
import VolumeSection from './chapters/VolumeSection';
import UnassignedSection from './chapters/UnassignedSection';
import { useGroupedChapters } from './chapters/hooks/useGroupedChapters';
import { DefaultCoinsModal, GlobalSettingsModal } from './GlobalPublishing';
import { useChapterSelection } from './chapters/hooks/useChapterSelection';
import { useChapterSettings } from './chapters/hooks/useChapterSettings';
import { useVolumeEditing } from './chapters/hooks/useVolumeEditing';

// moved chapter row utilities into ChapterRow

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
  const { settings: globalSettings, isLoading: isLoadingSettings, isSaving: isSavingSettings, saveSettings } = useChapterSettings(novelId, userId);

  // New state: track sort order (ascending by default)
  const [isDescending, setIsDescending] = useState(false);

  // Chapter selection & mass delete
  const {
    isMassDeleting,
    toggleMassDeleting,
    chaptersToDelete,
    toggleChapterForDeletion,
    massDeleteConfirmation,
    openMassDeleteConfirmation,
    closeMassDeleteConfirmation,
    confirmMassDelete,
    canConfirmMassDelete,
  } = useChapterSelection(onDeleteChapter, onLoadChapters);

  // Volume editing
  const { editingVolumeId, editingVolumeTitle, setEditingVolumeTitle, beginEdit, cancelEdit, saveEdit } = useVolumeEditing(
    novelId,
    userId,
    onLoadChapters
  );

  // Load saved sort order preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`chapterSortDescending_${novelId}`);
      if (stored !== null) {
        setIsDescending(stored === 'true');
      }
    }
  }, [novelId]);

  // Settings are handled by useChapterSettings

  const chaptersGroupedByVolume = useGroupedChapters(chapters, volumes, searchQuery, isDescending);

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

  // settings submit handled by useChapterSettings.saveSettings

  const handleOpenGlobalSettings = () => {
    // No need to fetch settings here since they're already loaded
    setIsGlobalSettingsModalOpen(true);
  };

  // selection logic moved to useChapterSelection

  const toggleSortOrder = () => {
    setIsDescending(prev => {
      const newVal = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`chapterSortDescending_${novelId}`, newVal.toString());
      }
      return newVal;
    });
  };

  const handleEditVolume = (volume: Volume) => beginEdit(volume);

  const handleCancelVolumeEdit = () => cancelEdit();

  const handleSaveVolumeEdit = async () => { await saveEdit(); };

  // removed inline chapter renderer; handled by ChapterRow inside sections

  const renderVolumeSection = (volume: Volume) => {
    const volumeChapters = chaptersGroupedByVolume.volumeChapters.get(volume.id) || [];
    const isEditing = editingVolumeId === volume.id;
    return (
      <div key={volume.id}>
        <VolumeSection
          volume={volume}
          chapters={volumeChapters}
          isCollapsed={collapsedVolumes.has(volume.id)}
          isEditing={isEditing}
          editingTitle={editingVolumeTitle}
          isMassDeleting={isMassDeleting}
          selectedForDeletion={chaptersToDelete}
          onToggleCollapse={toggleVolumeCollapse}
          onEditVolume={handleEditVolume}
          onDeleteVolume={(id: string) => setDeleteVolumeConfirmation({ isOpen: true, volumeId: id })}
          onChangeEditingTitle={setEditingVolumeTitle}
          onSaveEditingTitle={handleSaveVolumeEdit}
          onCancelEditing={handleCancelVolumeEdit}
          onEditChapter={handleEditChapter}
          onUnassignChapter={handleUnassignChapter}
          onDeleteChapterClick={handleDeleteClick}
          onToggleChapterForDeletion={toggleChapterForDeletion}
          highlightedChapterId={editingChapterId}
          novelId={novelId}
          userId={userId}
          onLoadChapters={onLoadChapters}
          onAssignChaptersClick={handleAssignChaptersClick}
          onCreateChapter={(volumeId) => handleCreateChapter(volumeId)}
        />
      </div>
    );
  };

  // sorting moved to useGroupedChapters

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-accent/50 p-2 sm:p-3 border-b border-border sticky top-0 z-10">
          <ChapterToolbar
            novelId={novelId}
            userId={userId}
            onLoadChapters={onLoadChapters}
            onCreateChapter={() => handleCreateChapter()}
            onOpenVolumeModal={() => setIsVolumeModalOpen(true)}
            onToggleSortOrder={toggleSortOrder}
            isDescending={isDescending}
            isMassDeleting={isMassDeleting}
            onToggleMassDeleting={toggleMassDeleting}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            chapterCount={chapters.length}
            canConfirmMassDelete={canConfirmMassDelete}
            onOpenMassDeleteConfirm={openMassDeleteConfirmation}
            onOpenGlobalSettings={handleOpenGlobalSettings}
          />
        </div>

        <div className="overflow-y-auto scrollbar-hide flex-1">
          {volumes.map(renderVolumeSection)}
          <UnassignedSection
            chapters={chaptersGroupedByVolume.noVolumeChapters}
            onCreateChapter={() => handleCreateChapter()}
            onEditChapter={handleEditChapter}
            onDeleteChapterClick={handleDeleteClick}
            onToggleChapterForDeletion={toggleChapterForDeletion}
            isMassDeleting={isMassDeleting}
            selectedForDeletion={chaptersToDelete}
            highlightedChapterId={editingChapterId}
          />
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
          onClose={closeMassDeleteConfirmation}
          onConfirm={confirmMassDelete}
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
          onSubmit={saveSettings}
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