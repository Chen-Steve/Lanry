import { Icon } from '@iconify/react';

interface SynopsisSectionProps {
  description: string;
  chaptersCount: number;
  bookmarkCount: number;
  viewCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  description, 
  chaptersCount, 
  bookmarkCount, 
  viewCount,
  status,
  createdAt,
  updatedAt
}: SynopsisSectionProps) => (
  <>
    <div className="prose max-w-none mb-6">
      <div className="flex items-center gap-6 mb-2">
        <h2 className="text-lg font-semibold m-0 text-black">Synopsis</h2>
        <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Icon icon="mdi:book-open-page-variant" className="text-lg" />
            <span>{chaptersCount} Chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="mdi:bookmark" className="text-lg" />
            <span>{bookmarkCount} Bookmarks</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="mdi:eye" className="text-lg" />
            <span>{viewCount} Views</span>
          </div>
        </div>
      </div>
      <div 
        className="text-sm text-black leading-relaxed"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>

    {/* Additional Info with updated date format */}
    <div className="grid grid-cols-2 gap-4 text-sm mb-8">
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