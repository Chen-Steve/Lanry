import { Icon } from '@iconify/react';
import { NovelCategory } from '@/types/database';

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
  cover_image_url?: string;
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
  return (
    <section>
      <button
        onClick={onToggleVisibility}
        className="w-full flex justify-between items-center p-3 bg-gray-100 rounded-lg"
      >
        <h3 className="font-medium text-black">My Novels</h3>
        <Icon 
          icon={isVisible ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
          className="w-6 h-6 text-black"
        />
      </button>
      
      <div className={`space-y-2 transition-all duration-300 overflow-hidden ${
        isVisible ? 'max-h-[1000px] mt-4' : 'max-h-0'
      }`}>
        {novels.map((novel) => (
          <div
            key={novel.id}
            className={`p-3 border rounded hover:bg-gray-100 cursor-pointer ${
              editingNovelId === novel.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div onClick={() => onNovelClick(novel)}>
                <h4 className="text-black">{novel.title}</h4>
                <p className="text-black">by {novel.author}</p>
                <span className="bg-gray-200 px-2 py-1 rounded mt-2 inline-block text-black">
                  {novel.status}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNovelDelete(novel.id);
                }}
                className="text-black hover:text-red-700 p-1"
                title="Delete novel"
              >
                <Icon icon="mdi:delete" className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 