import { Icon } from '@iconify/react';
import { NovelCategory } from '@/types/database';
import { useState } from 'react';

interface Novel {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  slug: string;
  created_at: string;
  updated_at: string;
  author_profile_id: string;
  categories?: NovelCategory[];
}

interface NovelListProps {
  novels: Novel[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  onNovelClick: (novel: Novel) => void;
  onNovelDelete: (novelId: string) => void;
  editingNovelId?: string;
}

export default function NovelList({
  novels,
  isVisible,
  onToggleVisibility,
  onNovelClick,
  onNovelDelete,
  editingNovelId
}: NovelListProps) {
  const [novelToDelete, setNovelToDelete] = useState<Novel | null>(null);

  const getStatusColor = (status: Novel['status']) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'HIATUS':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: Novel['status']) => {
    switch (status) {
      case 'ONGOING':
        return 'mdi:pencil';
      case 'COMPLETED':
        return 'mdi:check-circle';
      case 'HIATUS':
        return 'mdi:pause-circle';
    }
  };

  return (
    <>
      <section className="border rounded-lg border-gray-800 bg-white">
        <button
          onClick={onToggleVisibility}
          className="w-full flex justify-between items-center p-2"
        >
          <div className="flex items-center gap-2">
            <Icon icon="mdi:book-multiple" className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-black">My Novels</h3>
            <span className="text-sm text-gray-500">({novels.length})</span>
          </div>
          <Icon 
            icon={isVisible ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
            className="w-5 h-5 text-gray-600"
          />
        </button>
        
        <div className={`transition-all duration-300 overflow-hidden ${isVisible ? 'max-h-[1000px]' : 'max-h-0'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
            {novels.map((novel) => (
              <div
                key={novel.id}
                className={`group border rounded flex justify-between p-2 relative ${
                  editingNovelId === novel.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div 
                  onClick={() => onNovelClick(novel)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-medium text-sm truncate text-black">{novel.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 truncate">by {novel.author}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(novel.status)}`}>
                      <Icon icon={getStatusIcon(novel.status)} className="w-3.5 h-3.5" />
                      {novel.status}
                    </span>
                    {novel.categories && novel.categories.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {novel.categories.length} {novel.categories.length === 1 ? 'category' : 'categories'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNovelToDelete(novel);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                  title="Delete novel"
                >
                  <Icon icon="mdi:delete" className="w-4 h-4 text-red-600" />
                </button>
                {editingNovelId === novel.id && (
                  <div className="absolute -top-px -right-px rounded-bl rounded-tr bg-blue-500 text-white px-2 py-0.5 text-xs font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Icon icon="mdi:pencil" className="w-3 h-3" />
                      Editing
                    </span>
                  </div>
                )}
              </div>
            ))}
            {novels.length === 0 && (
              <div className="text-center py-4 text-gray-500 col-span-full">
                <Icon icon="mdi:book-plus" className="w-8 h-8 mx-auto mb-2" />
                <p>No novels yet. Create your first novel below!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {novelToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h4 className="text-lg font-medium mb-2">Delete Novel</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &quot;{novelToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNovelToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onNovelDelete(novelToDelete.id);
                  setNovelToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 