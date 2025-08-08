'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Novel } from '@/types/database';
import { fetchAuthorNovels, updateNovel } from '@/app/author/_services/novelManagementService';
import { deleteNovel } from '@/app/author/_services/novelUploadService';
import { toast } from 'sonner';
import NovelEditForm from './NovelEditForm';
import ChapterEditForm from './ChapterEditForm';
import NovelCard from './NovelCard';

interface NovelWithChapters extends Novel {
  chapterCount: number;
}

const emptyNovel: NovelWithChapters = {
  id: '',
  title: '',
  description: '',
  author: '',
  status: 'DRAFT',
  ageRating: 'EVERYONE',
  slug: '',
  coverImageUrl: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  chapters: [],
  bookmarkCount: 0,
  views: 0,
  rating: 0,
  ratingCount: 0,
  chapterCount: 0,
  author_profile_id: '',
  is_author_name_custom: true
};

export default function NovelManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [novels, setNovels] = useState<NovelWithChapters[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [novelToDelete, setNovelToDelete] = useState<NovelWithChapters | null>(null);
  const [novelToEdit, setNovelToEdit] = useState<NovelWithChapters | null>(null);
  const [view, setView] = useState<'list' | 'edit' | 'chapter'>('list');
  const [chapterEditData, setChapterEditData] = useState<{
    novelId: string;
    chapterId?: string;
    userId: string;
    volumeId?: string;
    autoReleaseEnabled?: boolean;
  } | null>(null);

  useEffect(() => {
    loadNovels();
  }, []);

  const loadNovels = async () => {
    setIsLoading(true);
    try {
      const novels = await fetchAuthorNovels();
      setNovels(novels);
    } catch (error) {
      console.error('Error fetching novels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (novel: Novel) => {
    const novelWithChapters = novel as NovelWithChapters;
    setNovelToEdit(novelWithChapters);
    setView('edit');
  };

  const handleEditCancel = () => {
    setNovelToEdit(null);
    setView('list');
  };

  const handleChapterEdit = (data: {
    novelId: string;
    chapterId?: string;
    userId: string;
    volumeId?: string;
    autoReleaseEnabled?: boolean;
  }) => {
    setChapterEditData(data);
    setView('chapter');
  };

  const handleChapterEditCancel = () => {
    setChapterEditData(null);
    setView('edit');
  };

  const handleChapterEditSave = () => {
    setChapterEditData(null);
    setView('edit');
  };

  const handleEditComplete = async (updatedNovel: Novel) => {
    try {
      await updateNovel(updatedNovel);
      // Always refresh the novels list to get the latest data
      await loadNovels();
      
      if (!updatedNovel.id) {
        // If this was a new novel, switch back to list view
        setView('list');
      }
    } catch (error) {
      throw error; // Let the NovelEditForm handle the error
    }
  };

  const filteredNovels = novels.filter((novel) =>
    novel.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteNovel = async () => {
    if (!novelToDelete) return;
    
    try {
      await deleteNovel(novelToDelete.id);
      toast.success('Novel deleted successfully');
      setNovelToDelete(null);
      loadNovels(); // Refresh the novels list
    } catch (error) {
      console.error('Error deleting novel:', error);
      toast.error('Failed to delete novel');
    }
  };

  const handleDeleteClick = (novel: Novel) => {
    const novelWithChapters = novel as NovelWithChapters;
    setNovelToDelete(novelWithChapters);
  };

  if (view === 'chapter' && chapterEditData) {
    return (
      <ChapterEditForm
        {...chapterEditData}
        onCancel={handleChapterEditCancel}
        onSave={handleChapterEditSave}
      />
    );
  }

  if (view === 'edit' && novelToEdit) {
    return (
      <NovelEditForm
        novel={novelToEdit}
        onCancel={handleEditCancel}
        onUpdate={handleEditComplete}
        onChapterEdit={handleChapterEdit}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4">
      {/* Sticky Header + Actions */}
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-2 pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Novel Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Create and manage your novels
              {filteredNovels.length > 0 && (
                <span className="hidden sm:inline">
                  {` (${filteredNovels.length} novel${filteredNovels.length !== 1 ? 's' : ''})`}
                </span>
              )}
            </p>
            {/* Mobile-only count */}
            {filteredNovels.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5 sm:hidden">
                {filteredNovels.length} novel{filteredNovels.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setNovelToEdit(emptyNovel);
                setView('edit');
              }}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 active:bg-primary/95 transition-colors text-sm sm:text-base min-h-[40px] sm:min-h-[44px] w-full sm:w-auto touch-manipulation"
            >
              <Icon icon="ph:plus" className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium -mb-0.5">Create</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-2">
          <div className="relative">
            <Icon icon="ph:magnifying-glass" className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search novels..."
              className="w-full pl-10 sm:pl-11 pr-9 py-2 sm:py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base min-h-[40px] sm:min-h-[44px]"
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent"
              >
                <Icon icon="ph:x" className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-border rounded-lg p-3 sm:p-4 animate-pulse bg-background">
                <div className="h-40 bg-muted rounded-md mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Novels Grid */}
      {!isLoading && (
        <>
          {filteredNovels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredNovels.map((novel) => (
                <NovelCard
                  key={novel.id}
                  novel={novel}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="col-span-full">
              <div className="border border-dashed border-border rounded-lg p-6 sm:p-8 lg:p-12 text-center">
                <Icon icon="ph:book" className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2">
                  {searchQuery ? 'No Novels Found' : 'No Novels Yet'}
                </h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base max-w-sm mx-auto leading-relaxed">
                  {searchQuery 
                    ? 'Try adjusting your search criteria.'
                    : 'Start creating your first novel to see it here.'
                  }
                </p>
                {!searchQuery && (
                  <button 
                    onClick={() => {
                      setNovelToEdit(emptyNovel);
                      setView('edit');
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 sm:px-6 py-3 rounded-lg hover:bg-primary/90 active:bg-primary/95 transition-colors text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
                  >
                    <Icon icon="ph:plus" className="h-4 w-4" />
                    <span className="font-medium">Add Your First Novel</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {novelToDelete && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <Icon icon="ph:warning" className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Delete Novel</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to delete <strong>&quot;{novelToDelete.title}&quot;</strong>? This will permanently remove the novel and all its chapters.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => setNovelToDelete(null)}
                className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNovel}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                Delete Novel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 