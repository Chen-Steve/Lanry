'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Novel } from '@/types/database';
import Image from 'next/image';
import { fetchAuthorNovels, updateNovel } from '@/app/author/_services/novelManagementService';
import { deleteNovel } from '@/app/author/_services/novelUploadService';
import { toast } from 'react-hot-toast';
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
    <main className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Novel Management</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="py-12 text-center">
            <Icon icon="mdi:loading" className="animate-spin text-3xl text-primary/60" />
          </div>
        ) : filteredNovels.length > 0 ? (
          filteredNovels.map((novel) => (
            <article key={novel.id} className="relative flex gap-4 bg-background hover:bg-accent/50 py-2 px-4 border border-border rounded-lg mb-2">
              <button 
                className="absolute top-2 right-4 p-1.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                aria-label="Delete novel"
                onClick={() => setNovelToDelete(novel)}
              >
                <Icon icon="mdi:delete" className="w-5 h-5" />
              </button>

              <div className="w-[80px] h-[120px] flex-shrink-0">
                <Image
                  src={novel.coverImageUrl || '/images/default-cover.jpg'}
                  alt={novel.title}
                  width={80}
                  height={120}
                  className="object-cover w-full h-full rounded border border-border"
                  priority
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h2 className="font-medium text-lg text-foreground mb-1 pr-8">{novel.title}</h2>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {novel.chapterCount} Chapters
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${novel.status === 'ONGOING' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                        novel.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'}`}>
                      <Icon icon={
                        novel.status === 'ONGOING' ? 'mdi:pencil' :
                        novel.status === 'COMPLETED' ? 'mdi:check-circle' :
                        'mdi:pause-circle'
                      } className="w-3.5 h-3.5" />
                      {novel.status}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${novel.ageRating === 'EVERYONE' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                        novel.ageRating === 'TEEN' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                        novel.ageRating === 'MATURE' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                      <Icon icon={ageRatingIcons[novel.ageRating]} className="w-3.5 h-3.5" />
                      {ageRatingLabels[novel.ageRating]}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
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
          <p className="py-12 text-center text-muted-foreground">
            No novels found. Click &quot;Add New Novel&quot; to create one.
          </p>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {novelToDelete && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-border">
            <h3 className="text-lg font-medium text-foreground mb-4">Delete Novel</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete &quot;{novelToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
                onClick={() => setNovelToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors"
                onClick={handleDeleteNovel}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="flex justify-center items-center gap-2">
        <button 
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Previous page"
        >
          <Icon icon="mdi:chevron-left" className="text-xl text-foreground" />
        </button>
        <span className="px-4 py-2 text-foreground">Page 1 of 1</span>
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