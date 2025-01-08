'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { NovelCategory } from '@/types/database';
import * as categoryService from '@/app/author/_services/categoryService';
import { toast } from 'react-hot-toast';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
  selectedCategories: NovelCategory[];
  onCategoriesChange: (categories: NovelCategory[]) => void;
}

export default function CategorySelectionModal({
  isOpen,
  onClose,
  novelId,
  selectedCategories,
  onCategoriesChange,
}: CategorySelectionModalProps) {
  const [categories, setCategories] = useState<NovelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedCategories.map(c => c.id))
  );

  useEffect(() => {
    setSelectedIds(new Set(selectedCategories.map(c => c.id)));
  }, [selectedCategories]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await categoryService.getCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleToggleCategory = async (category: NovelCategory) => {
    const newSelectedIds = new Set(selectedIds);
    
    if (selectedIds.has(category.id)) {
      // Remove category
      try {
        const success = await categoryService.removeNovelCategory(novelId, category.id);
        if (success) {
          newSelectedIds.delete(category.id);
          setSelectedIds(newSelectedIds);
          const updatedCategories = selectedCategories.filter(c => c.id !== category.id);
          onCategoriesChange(updatedCategories);
          toast.success(`Removed category: ${category.name}`);
        } else {
          toast.error('Failed to remove category');
        }
      } catch (error) {
        console.error('Error removing category:', error);
        toast.error('Failed to remove category');
      }
    } else {
      // Add category
      try {
        const success = await categoryService.addNovelCategories(novelId, [category.id]);
        if (success) {
          newSelectedIds.add(category.id);
          setSelectedIds(newSelectedIds);
          const updatedCategories = [...selectedCategories, category];
          onCategoriesChange(updatedCategories);
          toast.success(`Added category: ${category.name}`);
        } else {
          toast.error('Failed to add category');
        }
      } catch (error) {
        console.error('Error adding category:', error);
        toast.error('Failed to add category');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-[500px] max-h-[80vh] shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-medium text-foreground">Select Categories</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No categories available</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleToggleCategory(category)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedIds.has(category.id)
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Icon
                    icon={selectedIds.has(category.id) ? 'mdi:check-circle' : 'mdi:circle-outline'}
                    className="w-5 h-5 flex-shrink-0"
                  />
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4">
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