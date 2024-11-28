import { Icon } from '@iconify/react';

interface SynopsisSectionProps {
  title: string;
  description: string;
  chaptersCount: number;
  bookmarkCount: number;
  viewCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  translator?: { username: string } | null;
}

const formatDateMDY = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
};

export const SynopsisSection = ({ 
  title,
  description, 
  chaptersCount, 
  bookmarkCount, 
  viewCount,
  status,
  createdAt,
  updatedAt,
  author,
  translator
}: SynopsisSectionProps) => (
  <>
    <h1 className="text-3xl font-bold mb-4 text-black">{title}</h1>
    <div className="prose max-w-none mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 mb-2">
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 sm:mt-0">
          <div className="flex items-center gap-1">
            <Icon icon="pepicons-print:book" className="text-lg text-blue-600" />
            <span>{chaptersCount} Chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="pepicons-print:bookmark" className="text-lg text-red-500" />
            <span>{bookmarkCount} Bookmarks</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="pepicons-print:eye" className="text-lg text-purple-600" />
            <span>{viewCount} Views</span>
          </div>
        </div>
      </div>
      <div 
        className="text-sm text-black leading-relaxed"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-8">
      <div>
        <span className="text-gray-600">Author:</span>
        <span className="ml-2 font-medium text-black">{author}</span>
      </div>
      {translator && (
        <div>
          <span className="text-gray-600">Translator:</span>
          <span className="ml-2 font-medium text-black">{translator.username}</span>
        </div>
      )}
      <div>
        <span className="text-gray-600">Status:</span>
        <span className="ml-2 font-medium text-black">{status}</span>
      </div>
      <div>
        <span className="text-gray-600">Released:</span>
        <span className="ml-2 font-medium text-black">{formatDateMDY(createdAt)}</span>
      </div>
      <div>
        <span className="text-gray-600">Updated:</span>
        <span className="ml-2 font-medium text-black">{formatDateMDY(updatedAt)}</span>
      </div>
    </div>
  </>
); 