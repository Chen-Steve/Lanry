'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListProps, ChapterListChapter, Volume } from '../_types/authorTypes';
import { toast } from 'react-hot-toast';
import ChapterEditForm from './ChapterEditForm';

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
  onChapterClick,
  onDeleteChapter,
  onCreateVolume,
  onCreateChapter,
  novelId,
  userId
}: ChapterListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [volumeName, setVolumeName] = useState('');
  const [volumeNumber, setVolumeNumber] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | undefined>();

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
    setShowChapterForm(true);
  };

  const renderChapter = (chapter: ChapterListChapter) => (
    <div
      key={chapter.id}
      className={`relative group ${
        editingChapterId === chapter.id 
          ? 'bg-blue-50 hover:bg-blue-100' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div 
        onClick={() => onChapterClick(chapter)}
        className="p-3 sm:p-4 cursor-pointer"
      >
        <div className="flex flex-col gap-1 pr-8">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChapterClick(chapter);
                }}
                className="mr-2 px-2 py-0.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded"
              >
                Edit
              </button>
              Chapter {chapter.chapter_number}
              {chapter.part_number && (
                <span className="text-gray-700">
                  {" "}Part {chapter.part_number}
                </span>
              )}
              {chapter.title && (
                <span className="text-gray-700 ml-1">: {chapter.title}</span>
              )}
            </h4>
            {chapter.publish_at && (
              <p className="text-sm text-gray-600">
                {new Date(chapter.publish_at) > new Date() 
                  ? `Scheduled: ${new Date(chapter.publish_at).toLocaleDateString()}`
                  : `Published: ${new Date(chapter.publish_at).toLocaleDateString()}`
                }
              </p>
            )}
          </div>
          
          {isAdvancedChapter(chapter) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <Icon icon="mdi:star" className="w-4 h-4 mr-1" />
              Advanced
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDeleteChapter(chapter.id)}
        className="absolute top-2 right-1 sm:top-2 sm:right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        title="Delete chapter"
      >
        <Icon icon="mdi:delete-outline" className="w-4 h-4" />
      </button>
    </div>
  );

  const renderVolumeSection = (volume: Volume) => {
    const volumeChapters = chaptersGroupedByVolume.volumeChapters.get(volume.id) || [];

    return (
      <div key={volume.id} className="border-t first:border-t-0">
        <div className="bg-gray-50 px-3 py-2 flex justify-between items-center sticky top-12 z-[5]">
          <h3 className="text-sm font-medium text-gray-700">
            Volume {volume.volumeNumber}: {volume.title}
          </h3>
          <button
            onClick={() => handleCreateChapter(volume.id)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
          >
            <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
            Add Chapter
          </button>
        </div>
        <div className="divide-y">
          {volumeChapters
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .map(renderChapter)}
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-24rem)]">
      {showChapterForm ? (
        <div className="p-4">
          <ChapterEditForm
            novelId={novelId}
            userId={userId}
            onCancel={() => setShowChapterForm(false)}
            onSave={() => {
              setShowChapterForm(false);
              if (onCreateChapter) {
                onCreateChapter(selectedVolumeId);
              }
            }}
          />
        </div>
      ) : (
        <>
          <div className="bg-gray-50 p-2 sm:p-3 border-b sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateChapter()}
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                    className="w-full pl-8 pr-3 py-1 text-sm bg-white border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Icon 
                    icon="mdi:magnify"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVolumeModalOpen(true)}
                  className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Volume
                </button>
                <span className="text-sm text-gray-500 ml-2 whitespace-nowrap">
                  {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto scrollbar-hide flex-1">
            {/* Render chapters not in any volume */}
            {chaptersGroupedByVolume.noVolumeChapters.length > 0 && (
              <div className="divide-y">
                {chaptersGroupedByVolume.noVolumeChapters
                  .sort((a, b) => a.chapter_number - b.chapter_number)
                  .map(renderChapter)}
              </div>
            )}

            {/* Render volumes and their chapters */}
            {volumes.map(renderVolumeSection)}
          </div>

          {/* Volume Creation Modal */}
          {isVolumeModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Volume</h3>
                <form onSubmit={handleVolumeSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="volumeNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Volume Number
                      </label>
                      <input
                        type="number"
                        id="volumeNumber"
                        value={volumeNumber}
                        onChange={(e) => setVolumeNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter volume number"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label htmlFor="volumeName" className="block text-sm font-medium text-gray-700 mb-1">
                        Volume Title
                      </label>
                      <input
                        type="text"
                        id="volumeName"
                        value={volumeName}
                        onChange={(e) => setVolumeName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter volume title"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsVolumeModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    >
                      Create Volume
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 