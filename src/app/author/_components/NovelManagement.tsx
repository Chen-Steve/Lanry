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
  title: 'Untitled Novel',
  description: 'Enter your novel description here...',
  author: 'Anonymous',
  status: 'ONGOING',
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
        <h1 className="text-2xl font-bold text-gray-800">Novel Management</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search novels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="py-12 text-center">
            <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
          </div>
        ) : filteredNovels.length > 0 ? (
          filteredNovels.map((novel) => (
            <article key={novel.id} className="flex gap-4 bg-white py-2 px-4 border-b last:border-b-0 relative">
              <button 
                className="absolute top-2 right-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
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
                  className="object-cover w-full h-full rounded"
                  priority
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h2 className="font-medium text-lg text-gray-900 mb-1 pr-8">{novel.title}</h2>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {novel.chapterCount} Chapters
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${novel.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
                        novel.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      <Icon icon={
                        novel.status === 'ONGOING' ? 'mdi:pencil' :
                        novel.status === 'COMPLETED' ? 'mdi:check-circle' :
                        'mdi:pause-circle'
                      } className="w-3.5 h-3.5" />
                      {novel.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="px-4 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
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
          <p className="py-12 text-center text-gray-500">
            No novels found. Click &quot;Add New Novel&quot; to create one.
          </p>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {novelToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Novel</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{novelToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setNovelToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Previous page"
        >
          <Icon icon="mdi:chevron-left" className="text-xl" />
        </button>
        <span className="px-4 py-2">Page 1 of 1</span>
        <button 
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Next page"
        >
          <Icon icon="mdi:chevron-right" className="text-xl" />
        </button>
      </footer>
    </main>
  );
} 