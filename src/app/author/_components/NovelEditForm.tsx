'use client';

import { Icon } from '@iconify/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ChapterList from './ChapterList';
import NovelCoverImage from './NovelCoverImage';
import CategorySelectionModal from './CategorySelectionModal';
import * as authorChapterService from '../_services/authorChapterService';
import * as categoryService from '../_services/categoryService';
import { useAuth } from '@/hooks/useAuth';
import { ChapterListChapter, NovelEditFormProps, Volume, NovelCategory } from '../_types/authorTypes';

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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<NovelCategory[]>([]);

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

  useEffect(() => {
    const loadCategories = async () => {
      if (!novel.id) return;
      try {
        const categories = await categoryService.getNovelCategories(novel.id);
        setSelectedCategories(categories);
      } catch (error) {
        console.error('Error loading novel categories:', error);
        toast.error('Failed to load categories');
      }
    };

    loadCategories();
  }, [novel.id]);

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

  const handleCoverUpdate = async (coverImageUrl: string) => {
    const updatedNovel = {
      ...novel,
      coverImageUrl,
    };
    await onUpdate(updatedNovel);
    novel.coverImageUrl = coverImageUrl;
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

  const handleCreateVolume = async (volumeData: { title: string; volumeNumber: number }) => {
    try {
      await authorChapterService.createVolume(novel.id, userId || '', volumeData);
      await loadChapters(); // Refresh the volumes list
      toast.success('Volume created successfully');
    } catch (error) {
      console.error('Error creating volume:', error);
      toast.error('Failed to create volume');
    }
  };

  const statusOptions = [
    { value: 'ONGOING', label: 'Ongoing', icon: 'mdi:pencil' },
    { value: 'COMPLETED', label: 'Completed', icon: 'mdi:check-circle' },
    { value: 'HIATUS', label: 'Hiatus', icon: 'mdi:pause-circle' }
  ] as const;

  return (
    <main className="space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-foreground bg-background hover:bg-accent rounded-lg px-4 py-2 border border-border shadow-sm transition-colors"
      >
        <Icon icon="mdi:arrow-left" className="w-4 h-4" />
        <span className="font-medium">Novel List</span>
      </button>

      <div className="bg-background rounded-lg shadow-sm p-6 border border-border">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-6 items-start">
              <NovelCoverImage 
                coverImageUrl={novel.coverImageUrl}
                onUpdate={handleCoverUpdate}
              />
              <div className="flex flex-col flex-grow h-[270px]">
                <div>
                  <div className="flex items-center gap-2 max-w-[500px]">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xl font-semibold text-foreground px-2 py-1 border-b border-border hover:border-muted-foreground focus:border-primary focus:ring-0 focus:outline-none w-fit min-w-[200px] truncate bg-background placeholder:text-muted-foreground"
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
                        className="px-3 py-1 text-sm border-b border-border hover:border-muted-foreground focus:border-primary focus:ring-0 focus:outline-none w-fit min-w-[150px] bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-accent hover:bg-accent/80 rounded transition-colors"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      <Icon icon="mdi:tag-multiple" className="w-3.5 h-3.5" />
                      {selectedCategories.length > 0 ? `${selectedCategories.length} Categories` : 'Add Categories'}
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="flex gap-2">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            status === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => setStatus(option.value)}
                        >
                          <Icon icon={option.icon} className="w-4 h-4" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-end">
                  <div className="relative group flex items-start gap-2">
                    <div className="flex-grow min-h-[100px] text-sm text-muted-foreground whitespace-pre-wrap">
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
                      className="flex-shrink-0 p-1.5 text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all shadow-sm border border-primary"
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
              className="px-2 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? 'Saving...' : novel.id ? 'Save Changes' : 'Create Novel'}
            </button>
          </div>

          {/* Description Edit Modal */}
          {isDescriptionModalOpen && (
            <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-background rounded-lg w-[700px] shadow-lg border border-border">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <h3 className="text-lg font-medium text-foreground">Edit Description</h3>
                  <button
                    onClick={() => setIsDescriptionModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close dialog"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3">
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none h-[150px] bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="Synopsis"
                  />
                </div>
                <div className="flex justify-end gap-3 border-t border-border p-3">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionModalOpen(false)}
                    className="px-3 py-1.5 text-sm font-medium text-foreground bg-background border border-border hover:bg-accent/50 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(editingDescription);
                      setIsDescriptionModalOpen(false);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapter List */}
          {novel.id && (
            <div className="space-y-4">
              {isLoadingChapters ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:loading" className="w-6 h-6 animate-spin mx-auto text-primary/60" />
                </div>
              ) : (
                <ChapterList
                  chapters={chapters}
                  volumes={volumes}
                  editingChapterId={undefined}
                  onChapterClick={() => {}}
                  onDeleteChapter={handleDeleteChapter}
                  onCreateVolume={handleCreateVolume}
                  onCreateChapter={() => {}}
                  novelId={novel.id}
                  userId={userId || ''}
                  onLoadChapters={loadChapters}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        novelId={novel.id}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
      />
    </main>
  );
}