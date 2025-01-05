'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ChapterList from './ChapterList';
import * as authorChapterService from '../_services/authorChapterService';
import { useAuth } from '@/hooks/useAuth';
import { ChapterListChapter, NovelEditFormProps, Volume } from '../_types/authorTypes';

export default function NovelEditForm({ novel, onCancel, onUpdate }: NovelEditFormProps) {
  const { userId, isLoading: isAuthLoading } = useAuth();
  const [title, setTitle] = useState(novel.title);
  const [author, setAuthor] = useState(novel.author || '');
  const [description, setDescription] = useState(novel.description || '');
  const [status, setStatus] = useState(novel.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const [chapters, setChapters] = useState<ChapterListChapter[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadChapters = useCallback(async () => {
    if (!userId || !novel.id) {
      setIsLoadingChapters(false);
      return;
    }
    
    try {
      const chaptersData = await authorChapterService.fetchNovelChapters(novel.id, userId, true);
      const volumesData = await authorChapterService.fetchNovelVolumes(novel.id, userId);
      
      setChapters(chaptersData.map(chapter => ({
        ...chapter,
        volumeId: chapter.volume_id,
        updated_at: chapter.updated_at || chapter.created_at
      })));
      
      setVolumes(volumesData.map(volume => ({
        id: volume.id,
        volumeNumber: volume.volume_number,
        title: volume.title
      })));
    } catch (error) {
      console.error('Error loading chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setIsLoadingChapters(false);
    }
  }, [novel.id, userId]);

  useEffect(() => {
    if (!isAuthLoading && novel.id) {
      loadChapters();
    }
  }, [isAuthLoading, loadChapters, novel.id]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updatedNovel = {
        ...novel,
        title,
        author,
        description,
        status
      };
      await onUpdate(updatedNovel);
      toast.success('Save successful!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'ONGOING', label: 'Ongoing', icon: 'mdi:pencil' },
    { value: 'COMPLETED', label: 'Completed', icon: 'mdi:check-circle' },
    { value: 'HIATUS', label: 'Hiatus', icon: 'mdi:pause-circle' }
  ] as const;

  const handleCoverImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow image files
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Max file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      const updatedNovel = {
        ...novel,
        coverImageUrl: data.url,
      };
      await onUpdate(updatedNovel);
      novel.coverImageUrl = data.url;
      toast.success('Cover image updated successfully');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover image');
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await authorChapterService.deleteChapter(chapterId, novel.id, userId || '');
      await loadChapters(); // Refresh the chapters list
      toast.success('Chapter deleted successfully');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  return (
    <main className="space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 shadow-sm transition-colors"
      >
        <Icon icon="mdi:arrow-left" className="w-4 h-4" />
        <span className="font-medium">Novel List</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-6 items-start">
              <div 
                className="w-[180px] h-[270px] relative rounded-lg overflow-hidden shadow-md flex-shrink-0 group cursor-pointer"
                onClick={handleCoverImageClick}
              >
                {isUploadingCover ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Icon icon="mdi:loading" className="w-8 h-8 text-white animate-spin" />
                  </div>
                ) : (
                  <>
                    {novel.coverImageUrl ? (
                      <Image
                        src={novel.coverImageUrl}
                        alt={novel.title}
                        fill
                        sizes="180px"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500 text-sm font-medium">Cover image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon icon="mdi:camera" className="w-8 h-8 text-white" />
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload cover image"
                />
              </div>
              <div className="flex flex-col flex-grow h-[270px]">
                <div>
                  <div className="flex items-center gap-2 max-w-[500px]">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xl font-semibold text-gray-900 px-2 py-1 border-b border-gray-800 hover:border-gray-300 focus:border-indigo-500 focus:ring-0 focus:outline-none w-fit min-w-[200px] truncate"
                      placeholder="Novel Title"
                      title={title}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Original Author"
                        className="px-3 py-1 text-sm border-b border-gray-800 hover:border-gray-300 focus:border-indigo-500 focus:ring-0 focus:outline-none w-fit min-w-[150px]"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      onClick={() => {/* TODO: Implement tags modal */}}
                    >
                      <Icon icon="mdi:tag-multiple" className="w-3.5 h-3.5" />
                      Add Tags
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      onClick={() => {/* TODO: Implement categories modal */}}
                    >
                      <Icon icon="mdi:folder-multiple" className="w-3.5 h-3.5" />
                      Add Categories
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="flex gap-2">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatus(option.value)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                            ${status === option.value
                              ? option.value === 'ONGOING'
                                ? 'bg-green-100 text-green-800'
                                : option.value === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          <Icon icon={option.icon} className="w-3.5 h-3.5" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-end">
                  <div className="relative group flex items-start gap-2">
                    <div className="flex-grow min-h-[100px] text-sm text-gray-600 whitespace-pre-wrap">
                      {description.length > 300 
                        ? `${description.slice(0, 300)}...`
                        : description || 'No description available.'
                      }
                    </div>
                    <button
                      onClick={() => {
                        setEditingDescription(description);
                        setIsDescriptionModalOpen(true);
                      }}
                      aria-label="Edit Synopsis"
                      className="flex-shrink-0 p-1.5 text-white bg-indigo-500 hover:bg-indigo-700 rounded-md transition-all shadow-sm border border-indigo-500 hover:border-indigo-700"
                    >
                      <Icon icon="mdi:pencil" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              disabled={isSubmitting}
              onClick={handleSave}
              className="px-2 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? 'Saving...' : novel.id ? 'Save Changes' : 'Create Novel'}
            </button>
          </div>

          {/* Description Edit Modal */}
          {isDescriptionModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-[700px] shadow-xl">
                <div className="flex items-center justify-between border-b p-3">
                  <h3 className="text-lg font-medium">Edit Description</h3>
                  <button
                    onClick={() => setIsDescriptionModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close dialog"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3">
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-[150px]"
                    placeholder="Synopsis"
                  />
                </div>
                <div className="flex justify-end gap-3 border-t p-3">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionModalOpen(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(editingDescription);
                      setIsDescriptionModalOpen(false);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapter List */}
          {novel.id && (
            <div>
              {isLoadingChapters ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:loading" className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </div>
              ) : (
                <ChapterList
                  chapters={chapters}
                  volumes={volumes}
                  editingChapterId={undefined}
                  onChapterClick={(chapter) => {
                    // TODO: Implement chapter editing navigation
                    console.log('Edit chapter:', chapter);
                  }}
                  onDeleteChapter={handleDeleteChapter}
                  onCreateVolume={() => {}}
                  onCreateChapter={() => {}}
                  novelId={novel.id}
                  userId={userId || ''}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}