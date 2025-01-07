'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListProps, ChapterListChapter, Volume } from '../_types/authorTypes';
import { toast } from 'react-hot-toast';
import ChapterEditForm from './ChapterEditForm';
import ChapterBulkUpload from './ChapterBulkUpload';
import * as authorChapterService from '../_services/authorChapterService';
import { VolumeModal, DeleteConfirmationModal, AssignChaptersModal } from './ChapterListModals';

const isAdvancedChapter = (chapter: ChapterListChapter): boolean => {
  const now = new Date();
  const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
  
  return (publishDate !== null && publishDate > now) && 
         (chapter.coins !== undefined && chapter.coins > 0);
};

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

  const renderChapter = (chapter: ChapterListChapter) => (
    <div
      key={chapter.id}
      className={`relative group ${
        editingChapterId === chapter.id 
          ? 'bg-primary/10 hover:bg-primary/20' 
          : 'hover:bg-accent/50'
      }`}
    >
      <div 
        onClick={() => handleEditChapter(chapter)}
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
              Chapter {chapter.chapter_number}
              {chapter.part_number && (
                <span className="text-muted-foreground">
                  {" "}Part {chapter.part_number}
                </span>
              )}
              {chapter.title && (
                <span className="text-muted-foreground ml-1">: {chapter.title}</span>
              )}
            </h4>
            {chapter.publish_at && (
              <p className="text-sm text-muted-foreground">
                {new Date(chapter.publish_at) > new Date() 
                  ? `Scheduled: ${new Date(chapter.publish_at).toLocaleDateString()}`
                  : `Published: ${new Date(chapter.publish_at).toLocaleDateString()}`
                }
              </p>
            )}
          </div>
          
          {isAdvancedChapter(chapter) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <Icon icon="mdi:star" className="w-4 h-4 mr-1" />
              Advanced
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-1 sm:top-2 sm:right-2 flex items-center gap-1">
        {chapter.volumeId && (
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
              Volume {volume.volumeNumber}: {volume.title}
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
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .map(renderChapter)}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
      {showChapterForm ? (
        <ChapterEditForm
          novelId={novelId}
          userId={userId}
          chapterId={editingChapter?.id}
          volumeId={selectedVolumeId}
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
                    .sort((a, b) => a.chapter_number - b.chapter_number)
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
        </div>
      )}
    </div>
  );
} 