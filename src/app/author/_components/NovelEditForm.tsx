'use client';

import { Icon } from '@iconify/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ChapterList from './ChapterList';
import NovelCoverImage from './NovelCoverImage';
import CategorySelectionModal from './CategorySelectionModal';
import TagSelectionModal from './TagSelectionModal';
import * as authorChapterService from '../_services/authorChapterService';
import * as categoryService from '../_services/categoryService';
import * as tagService from '../_services/tagService';
import { useAuth } from '@/hooks/useAuth';
import { ChapterListChapter, NovelEditFormProps, Volume, NovelCategory } from '../_types/authorTypes';
import { Tag } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { CharacterManagement } from './CharacterManagement';

interface NovelCharacter {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  description?: string | null;
  orderIndex: number;
}

export default function NovelEditForm({ novel, onCancel, onUpdate }: NovelEditFormProps) {
  const { userId, isLoading: isAuthLoading } = useAuth();
  const [title, setTitle] = useState(novel.title);
  const [author, setAuthor] = useState(novel.author || '');
  const [description, setDescription] = useState(novel.description || '');
  const [status, setStatus] = useState(novel.status);
  const [ageRating, setAgeRating] = useState(novel.ageRating || 'EVERYONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const [chapters, setChapters] = useState<ChapterListChapter[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<NovelCategory[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState(novel.coverImageUrl || '');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [characters, setCharacters] = useState<NovelCharacter[]>([]);

  const loadCategories = useCallback(async () => {
    if (!novel.id) return;
    try {
      const categories = await categoryService.getNovelCategories(novel.id);
      setSelectedCategories(categories);
    } catch (error) {
      console.error('Error loading novel categories:', error);
      toast.error('Failed to load categories');
    }
  }, [novel.id]);

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

  const loadTags = useCallback(async () => {
    if (!novel.id) return;
    try {
      const tags = await tagService.getNovelTags(novel.id);
      setSelectedTags(tags);
    } catch (error) {
      console.error('Error loading novel tags:', error);
      toast.error('Failed to load tags');
    }
  }, [novel.id]);

  const loadCharacters = useCallback(async () => {
    if (!novel.id) return;
    try {
      const { data, error } = await supabase
        .from('novel_characters')
        .select('*')
        .eq('novel_id', novel.id)
        .order('order_index');

      if (error) throw error;
      
      setCharacters(data.map(char => ({
        id: char.id,
        name: char.name,
        role: char.role,
        imageUrl: char.image_url,
        description: char.description,
        orderIndex: char.order_index
      })));
    } catch (error) {
      console.error('Error loading characters:', error);
      toast.error('Failed to load characters');
    }
  }, [novel.id]);

  useEffect(() => {
    if (!isAuthLoading && novel.id) {
      loadCategories();
    }
  }, [isAuthLoading, loadCategories, novel.id]);

  useEffect(() => {
    if (!isAuthLoading && novel.id) {
      loadChapters();
    }
  }, [isAuthLoading, loadChapters, novel.id]);

  useEffect(() => {
    if (!isAuthLoading && novel.id) {
      loadTags();
    }
  }, [isAuthLoading, loadTags, novel.id]);

  useEffect(() => {
    if (!isAuthLoading && novel.id) {
      loadCharacters();
    }
  }, [isAuthLoading, loadCharacters, novel.id]);

  useEffect(() => {
    const handleCoverUpdate = () => {
      // Force a re-render by updating a state
      setIsSubmitting(prev => !prev);
    };
    
    window.addEventListener('novelCoverUpdated', handleCoverUpdate);
    return () => window.removeEventListener('novelCoverUpdated', handleCoverUpdate);
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const updatedNovel = {
        ...novel,
        title,
        author,
        description,
        status,
        ageRating,
        slug,
        categories: selectedCategories,
        tags: selectedTags
      };
      await onUpdate(updatedNovel);
      toast.success('Save successful!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverUpdate = async (newCoverImageUrl: string) => {
    try {
      const { error } = await supabase
        .from('novels')
        .update({
          cover_image_url: newCoverImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', novel.id);

      if (error) throw error;
      
      // Update both the novel and local state
      novel.coverImageUrl = newCoverImageUrl;
      setCoverImageUrl(newCoverImageUrl);
      
      toast.success('Cover image updated successfully');
    } catch (error) {
      console.error('Error updating cover:', error);
      toast.error('Failed to update cover image');
    }
  };

  const handleCoverDelete = async () => {
    try {
      const { error } = await supabase
        .from('novels')
        .update({
          cover_image_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', novel.id);

      if (error) throw error;
      
      // Update both the novel and local state
      novel.coverImageUrl = undefined;
      setCoverImageUrl('');
      
      toast.success('Cover image deleted successfully');
    } catch (error) {
      console.error('Error deleting cover:', error);
      toast.error('Failed to delete cover image');
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

  const handleCharactersUpdate = (updatedCharacters: NovelCharacter[]) => {
    setCharacters(updatedCharacters);
  };

  const statusOptions = [
    { value: 'ONGOING', label: 'Ongoing', icon: 'mdi:pencil' },
    { value: 'COMPLETED', label: 'Completed', icon: 'mdi:check-circle' },
    { value: 'HIATUS', label: 'Hiatus', icon: 'mdi:pause-circle' },
    { value: 'DROPPED', label: 'Dropped', icon: 'mdi:close-circle' }
  ] as const;

  const ageRatingOptions = [
    { value: 'EVERYONE', label: 'Everyone', icon: 'mdi:account-multiple', description: 'Suitable for all ages' },
    { value: 'TEEN', label: 'Teen', icon: 'mdi:account-school', description: 'May contain mild violence and language' },
    { value: 'MATURE', label: 'Mature', icon: 'mdi:account-alert', description: 'Contains mature themes and content' },
    { value: 'ADULT', label: 'Adult', icon: 'mdi:account-lock', description: 'Contains adult content' }
  ] as const;

  return (
    <main className="h-full w-full flex flex-col">
      <div className="flex justify-between items-start p-4 border-b border-border sticky top-0 bg-background z-10">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Go back"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5" />
        </button>
        <button
          disabled={isSubmitting}
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : novel.id ? 'Save Changes' : 'Create Novel'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex gap-6 items-start">
            <NovelCoverImage 
              coverImageUrl={coverImageUrl}
              onUpdate={handleCoverUpdate}
              onDelete={handleCoverDelete}
            />
            <div className="flex flex-col flex-grow">
              <div>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-semibold text-foreground px-2 py-1 border-b border-border hover:border-muted-foreground focus:border-primary focus:ring-0 focus:outline-none w-full truncate bg-background placeholder:text-muted-foreground"
                    placeholder="Enter your novel title"
                    title={title}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter original author name"
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
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-accent hover:bg-accent/80 rounded transition-colors"
                    onClick={() => setIsTagModalOpen(true)}
                  >
                    <Icon icon="mdi:tag" className="w-3.5 h-3.5" />
                    {selectedTags.length > 0 ? `${selectedTags.length} Tags` : 'Add Tags'}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            status === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => setStatus(option.value)}
                        >
                          <Icon icon={option.icon} className="w-3.5 h-3.5" />
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ageRatingOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors group relative ${
                            ageRating === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => setAgeRating(option.value)}
                        >
                          <Icon icon={option.icon} className="w-3.5 h-3.5" />
                          {option.label}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-background border border-border text-foreground text-[10px] rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="relative group flex items-start gap-2 w-full">
                  <div className="flex-grow min-h-[100px] max-h-[100px] text-sm text-muted-foreground whitespace-pre-wrap overflow-y-auto">
                    {description.length > 50 
                      ? `${description.slice(0, 50)}...`
                      : description || 'Enter your novel description here...'}
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

          {/* Description Edit Modal */}
          {isDescriptionModalOpen && (
            <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-background rounded-lg w-[700px] shadow-lg border border-border">
                <div className="flex items-center justify-between border-b border-border p-3">
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
            <div className="mt-6">
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

          <div className="mt-6 pb-6">
            <CharacterManagement
              novelId={novel.id}
              characters={characters}
              onCharactersUpdate={handleCharactersUpdate}
            />
          </div>
        </div>
      </div>

      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        novelId={novel.id}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        isNewNovel={!novel.id}
      />

      {/* Tag Selection Modal */}
      <TagSelectionModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        novelId={novel.id}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        isNewNovel={!novel.id}
      />
    </main>
  );
}