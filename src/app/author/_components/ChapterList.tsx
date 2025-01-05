'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListProps, ChapterListChapter, Volume } from '../_types/authorTypes';
import { toast } from 'react-hot-toast';
import ChapterEditForm from './ChapterEditForm';
import * as authorChapterService from '../_services/authorChapterService';

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
        await onLoadChapters(); // Refresh the volumes list
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
        null, // Setting volumeId to null unassigns the chapter
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
          : 'hover:bg-accent'
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
                className="mr-2 px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded"
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
          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
        <div className="bg-accent px-3 py-2 flex justify-between items-center">
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
              className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
          <div className="bg-accent p-2 sm:p-3 border-b border-border sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateChapter()}
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  Add Chapter
                </button>
              </div>
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters..."
                    className="w-full pl-8 pr-3 py-1 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            {/* Render volumes and their chapters first */}
            {volumes.map(renderVolumeSection)}

            {/* Render chapters not in any volume */}
            {chaptersGroupedByVolume.noVolumeChapters.length > 0 && (
              <div className="border-t border-border mt-4">
                <div className="bg-accent px-3 py-2 flex justify-between items-center">
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

          {/* Volume Creation Modal */}
          {isVolumeModalOpen && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 w-full max-w-md border-2 border-gray-600">
                <h3 className="text-lg font-medium text-foreground mb-4">Create New Volume</h3>
                <form onSubmit={handleVolumeSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="volumeNumber" className="block text-sm font-medium text-foreground mb-1">
                        Volume Number
                      </label>
                      <input
                        type="number"
                        id="volumeNumber"
                        value={volumeNumber}
                        onChange={(e) => setVolumeNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                        placeholder="Enter volume number"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label htmlFor="volumeName" className="block text-sm font-medium text-foreground mb-1">
                        Volume Title
                      </label>
                      <input
                        type="text"
                        id="volumeName"
                        value={volumeName}
                        onChange={(e) => setVolumeName(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                        placeholder="Enter volume title"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsVolumeModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md"
                    >
                      Create Volume
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmation.isOpen && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 w-full max-w-sm">
                <h3 className="text-lg font-medium text-foreground mb-3">Delete Chapter</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to delete this chapter? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmation({ isOpen: false, chapterId: null })}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Volume Delete Confirmation Modal */}
          {deleteVolumeConfirmation.isOpen && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 w-full max-w-sm">
                <h3 className="text-lg font-medium text-foreground mb-3">Delete Volume</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to delete this volume? All chapters in this volume will be unassigned. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteVolumeConfirmation({ isOpen: false, volumeId: null })}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteVolumeConfirmation.volumeId) {
                        handleDeleteVolume(deleteVolumeConfirmation.volumeId);
                        setDeleteVolumeConfirmation({ isOpen: false, volumeId: null });
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assign Chapters Modal */}
          {isAssignChaptersModalOpen && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 w-full max-w-2xl border-2 border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Assign Chapters to Volume</h3>
                  <button
                    onClick={() => setIsAssignChaptersModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close modal"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters..."
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {chaptersGroupedByVolume.noVolumeChapters
                    .sort((a, b) => a.chapter_number - b.chapter_number)
                    .filter(chapter => 
                      chapter.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      `Chapter ${chapter.chapter_number}${chapter.part_number ? ` Part ${chapter.part_number}` : ''}`.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(chapter => (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                        onClick={() => toggleChapterSelection(chapter.id)}
                      >
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedChapterIds.has(chapter.id)}
                            onChange={() => toggleChapterSelection(chapter.id)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                            aria-label={`Select Chapter ${chapter.chapter_number}${chapter.part_number ? ` Part ${chapter.part_number}` : ''}`}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
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
                        </div>
                      </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsAssignChaptersModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignChapters}
                    disabled={selectedChapterIds.size === 0}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign {selectedChapterIds.size} {selectedChapterIds.size === 1 ? 'Chapter' : 'Chapters'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 