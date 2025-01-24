import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Tag } from '@/types/database';

interface TagsModalProps {
  tags: Tag[];
  isOpen: boolean;
  onClose: () => void;
}

export const TagsModal = ({ tags, isOpen, onClose }: TagsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Tags</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close tags modal"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/search?tags=${tag.id}`}
              className="flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-full transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}; 