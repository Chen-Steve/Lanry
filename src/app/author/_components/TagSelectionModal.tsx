'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Tag } from '@/types/database';
import * as tagService from '@/app/author/_services/tagService';
import { toast } from 'sonner';

interface TagSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  isNewNovel?: boolean;
}

export default function TagSelectionModal({
  isOpen,
  onClose,
  novelId,
  selectedTags,
  onTagsChange,
  isNewNovel = false
}: TagSelectionModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedTags.map(t => t.id))
  );
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedIds(new Set(selectedTags.map(t => t.id)));
  }, [selectedTags]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const allTags = await tagService.getTags();
        setTags(allTags);
      } catch (error) {
        console.error('Error loading tags:', error);
        toast.error('Failed to load tags');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const handleToggleTag = async (tag: Tag) => {
    const newSelectedIds = new Set(selectedIds);
    
    if (selectedIds.has(tag.id)) {
      // Remove tag
      if (!isNewNovel) {
        try {
          const success = await tagService.removeNovelTag(novelId, tag.id);
          if (!success) {
            toast.error('Failed to remove tag');
            return;
          }
        } catch (error) {
          console.error('Error removing tag:', error);
          toast.error('Failed to remove tag');
          return;
        }
      }
      newSelectedIds.delete(tag.id);
      setSelectedIds(newSelectedIds);
      const updatedTags = selectedTags.filter(t => t.id !== tag.id);
      onTagsChange(updatedTags);
      if (!isNewNovel) {
        toast.success(`Removed tag: ${tag.name}`);
      }
    } else {
      // Add tag
      if (!isNewNovel) {
        try {
          const success = await tagService.addNovelTags(novelId, [tag.id]);
          if (!success) {
            toast.error('Failed to add tag');
            return;
          }
        } catch (error) {
          console.error('Error adding tag:', error);
          toast.error('Failed to add tag');
          return;
        }
      }
      newSelectedIds.add(tag.id);
      setSelectedIds(newSelectedIds);
      const updatedTags = [...selectedTags, tag];
      onTagsChange(updatedTags);
      if (!isNewNovel) {
        toast.success(`Added tag: ${tag.name}`);
      }
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsCreatingTag(true);
    try {
      const newTag = await tagService.createTag(newTagName.trim());
      setTags(prev => [...prev, newTag]);
      setNewTagName('');
      toast.success('Tag created successfully');
      
      // Automatically add the new tag to the novel
      await handleToggleTag(newTag);
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error instanceof Error) {
        if (error.message === 'A tag with this name already exists') {
          toast.error('A tag with this name already exists', {
            description: 'Please choose a different name for your tag.'
          });
        } else {
          toast.error('Failed to create tag', {
            description: error.message
          });
        }
      } else {
        toast.error('Failed to create tag');
      }
    } finally {
      setIsCreatingTag(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-[500px] max-h-[80vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-medium text-foreground">Manage Tags</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Create new tag..."
              className="flex-grow px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
              disabled={isCreatingTag}
            />
            <button
              type="submit"
              disabled={isCreatingTag || !newTagName.trim()}
              className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingTag ? (
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              ) : (
                'Create'
              )}
            </button>
          </form>

          <div className="relative mb-4">
            <Icon 
              icon="mdi:magnify" 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] border-t border-border bg-background flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tags available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags
                .filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedIds.has(tag.id)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80'
                    }`}
                  >
                    <Icon
                      icon={selectedIds.has(tag.id) ? 'mdi:close' : 'mdi:plus'}
                      className="w-4 h-4"
                    />
                    {tag.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4 bg-background">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 