'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Novel } from '@/types/database';
import { fetchAuthorNovels, updateNovel } from '@/app/author/_services/novelManagementService';
import { deleteNovel } from '@/app/author/_services/novelUploadService';
import { toast } from 'sonner';
import NovelEditForm from './NovelEditForm';

interface NovelWithChapters extends Novel {
  chapterCount: number;
}

const emptyNovel: NovelWithChapters = {
  id: '',
  title: '',
  description: '',
  author: '',
  status: 'ONGOING',
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

const ageRatingIcons = {
  EVERYONE: 'mdi:account-multiple',
  TEEN: 'mdi:account-school',
  MATURE: 'mdi:account-alert',
  ADULT: 'mdi:account-lock'
} as const;

const ageRatingLabels = {
  EVERYONE: 'Everyone',
  TEEN: 'Teen',
  MATURE: 'Mature',
  ADULT: 'Adult'
} as const;

export default function NovelManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [novels, setNovels] = useState<NovelWithChapters[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [novelToDelete, setNovelToDelete] = useState<NovelWithChapters | null>(null);
  const [novelToEdit, setNovelToEdit] = useState<NovelWithChapters | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const handleEditClick = (novel: NovelWithChapters) => {
    setNovelToEdit(novel);
    setView('edit');
  };

  const handleEditCancel = () => {
    setNovelToEdit(null);
    setView('list');
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

  const filteredNovels = novels.filter(novel =>
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

  if (view === 'edit' && novelToEdit) {
    return (
      <NovelEditForm
        novel={novelToEdit}
        onCancel={handleEditCancel}
        onUpdate={handleEditComplete}
      />
    );
  }

  return (
    <main className="space-y-4 sm:space-y-6 p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Novel Management</h1>
        <button
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          onClick={() => {
            setNovelToEdit(emptyNovel);
            setView('edit');
          }}
        >
          <Icon icon="mdi:plus" />
          Add New Novel
        </button>
      </header>

      <section className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Icon 
            icon="mdi:magnify" 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search novels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
          />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            className={`p-2 flex items-center justify-center ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-accent/50'}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Icon icon="mdi:grid" className="w-5 h-5" />
          </button>
          <button
            className={`p-2 flex items-center justify-center ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-accent/50'}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <Icon icon="mdi:format-list-bulleted" className="w-5 h-5" />
          </button>
        </div>
      </section>

      <section className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3' : 'flex flex-col gap-0 divide-y divide-border'}`}>
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <Icon icon="mdi:loading" className="animate-spin text-3xl text-primary/60" />
          </div>
        ) : filteredNovels.length > 0 ? (
          filteredNovels.map((novel) => (
            <article key={novel.id} className={`relative ${viewMode === 'grid' 
              ? 'flex gap-3 bg-background hover:bg-accent/50 p-2 xs:p-2.5 sm:p-3 border border-border rounded-lg' 
              : 'flex flex-row gap-2 bg-background hover:bg-accent/50 p-1.5 xs:p-2 sm:p-2.5 border-0 first:rounded-t-lg last:rounded-b-lg'}`}>
              <button 
                className="absolute top-1 xs:top-1.5 right-1 xs:right-1.5 p-0.5 xs:p-1 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                aria-label="Delete novel"
                onClick={() => setNovelToDelete(novel)}
              >
                <Icon icon="mdi:delete" className="w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4" />
              </button>

              <div className={`${viewMode === 'grid' 
                ? 'w-[45px] xs:w-[50px] sm:w-[60px] h-[68px] xs:h-[75px] sm:h-[90px]' 
                : 'w-[40px] xs:w-[45px] sm:w-[50px] h-[60px] xs:h-[68px] sm:h-[75px]'} flex-shrink-0`}>
                {novel.coverImageUrl ? (
                  <img
                    src={novel.coverImageUrl}
                    alt={novel.title}
                    className="object-cover w-full h-full rounded border border-border"
                  />
                ) : (
                  <div className="w-full h-full rounded border border-border bg-accent flex items-center justify-center">
                    <span className="text-muted-foreground text-[10px] font-medium">No cover</span>
                  </div>
                )}
              </div>

              <div className={`flex-1 min-w-0 flex flex-col ${viewMode === 'grid' ? 'justify-between py-0.5' : 'justify-center py-0'}`}>
                <div>
                  <h2 className={`font-medium text-sm xs:text-base text-foreground ${viewMode === 'grid' ? 'mb-1 xs:mb-1.5' : 'mb-0.5 xs:mb-1'} pr-4 xs:pr-5 sm:pr-6 line-clamp-1`}>{novel.title}</h2>

                  <div className={`flex flex-wrap items-center gap-1 ${viewMode === 'list' ? 'max-w-[650px]' : ''}`}>
                    <span className="text-[10px] xs:text-xs text-muted-foreground">
                      {novel.chapterCount} Chapters
                    </span>

                    <span className={`inline-flex items-center gap-0.5 xs:gap-1 px-1 xs:px-1.5 py-0.5 rounded-full text-[10px] xs:text-xs font-medium
                      ${novel.status === 'ONGOING' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                        novel.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'}`}>
                      <Icon icon={
                        novel.status === 'ONGOING' ? 'mdi:pencil' :
                        novel.status === 'COMPLETED' ? 'mdi:check-circle' :
                        'mdi:pause-circle'
                      } className="w-2.5 xs:w-3 h-2.5 xs:h-3" />
                      {novel.status}
                    </span>

                    <span className={`inline-flex items-center gap-0.5 xs:gap-1 px-1 xs:px-1.5 py-0.5 rounded-full text-[10px] xs:text-xs font-medium
                      ${novel.ageRating === 'EVERYONE' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                        novel.ageRating === 'TEEN' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                        novel.ageRating === 'MATURE' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                      <Icon icon={ageRatingIcons[novel.ageRating]} className="w-2.5 xs:w-3 h-2.5 xs:h-3" />
                      {ageRatingLabels[novel.ageRating]}
                    </span>
                  </div>
                </div>

                <div className={`${viewMode === 'grid' ? 'flex gap-2 mt-2 xs:mt-2.5' : 'flex gap-2 mt-1 xs:mt-1.5'}`}>
                  <button 
                    className={`${viewMode === 'grid' 
                      ? 'w-full px-3 xs:px-4 py-2 xs:py-2.5 text-sm sm:text-base' 
                      : 'w-auto px-2 xs:px-3 py-1 xs:py-1.5 text-xs sm:text-sm'} font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors`}
                    aria-label="Edit novel"
                    onClick={() => handleEditClick(novel)}
                  >
                    Edit Novel & Chapters
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="col-span-full py-12 text-center text-sm sm:text-base text-muted-foreground">
            No novels found. Click &quot;Add New Novel&quot; to create one.
          </p>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {novelToDelete && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-4 sm:p-6 max-w-sm w-full mx-auto shadow-xl border border-border">
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">Delete Novel</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Are you sure you want to delete &quot;{novelToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setNovelToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors"
                onClick={handleDeleteNovel}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="flex justify-center items-center gap-2 py-4">
        <button 
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Previous page"
        >
          <Icon icon="mdi:chevron-left" className="text-xl text-foreground" />
        </button>
        <span className="px-4 py-2 text-sm sm:text-base text-foreground">Page 1 of 1</span>
        <button 
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Next page"
        >
          <Icon icon="mdi:chevron-right" className="text-xl text-foreground" />
        </button>
      </footer>
    </main>
  );
} 