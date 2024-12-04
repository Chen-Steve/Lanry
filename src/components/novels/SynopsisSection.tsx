import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateMDY } from '@/lib/utils';
import { useState } from 'react';
import { ChapterList } from './ChapterList';
import { Chapter, UserProfile } from '@/types/database';
import { NovelRecommendations } from './NovelRecommendations';
import { NovelComments } from './NovelComments';

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
  novelSlug: string;
  firstChapterNumber?: number;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
  showActionButtons: boolean;
  coverImageUrl?: string;
  chapters: Chapter[];
  novelId: string;
  userProfile: UserProfile | null;
  novelAuthorId: string;
}

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
  translator,
  novelSlug,
  firstChapterNumber,
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
  showActionButtons,
  coverImageUrl,
  chapters,
  novelId,
  userProfile,
  novelAuthorId,
}: SynopsisSectionProps) => {
  const [activeTab, setActiveTab] = useState<'synopsis' | 'chapters' | 'recommendations' | 'comments'>('synopsis');

  return (
  <div className="max-w-5xl mx-auto px-4 py-4">
    {/* Header Section */}
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      {/* Cover Image */}
      <div className="w-48 sm:w-36 md:w-44 mx-auto sm:mx-0 flex-shrink-0">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
          {coverImageUrl ? (
            <Image
              src={`/novel-covers/${coverImageUrl}`}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 640px) 192px, (max-width: 768px) 144px, 176px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </div>

      {/* Title and Quick Stats */}
      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900">{title}</h1>
        <div className="text-sm text-gray-600 mb-3">
          by {author}
          {translator && (
            <> • TL: <span className="text-gray-700">{translator.username}</span></>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm mb-4">
          <StatsItem icon="pepicons-print:book" value={`${chaptersCount} Chapters`} color="blue" />
          <StatsItem icon="pepicons-print:bookmark" value={`${bookmarkCount} Bookmarks`} />
          <StatsItem icon="pepicons-print:eye" value={`${viewCount} Views`} color="purple" />
        </div>

        {/* Action Buttons */}
        {showActionButtons && (
          <div className="flex flex-col sm:flex-row gap-3">
            <ReadButton
              firstChapterNumber={firstChapterNumber}
              novelSlug={novelSlug}
            />
            <BookmarkButton
              isAuthenticated={isAuthenticated}
              isBookmarked={isBookmarked}
              isBookmarkLoading={isBookmarkLoading}
              onBookmarkClick={onBookmarkClick}
            />
          </div>
        )}
      </div>
    </div>

    {/* Tab Navigation */}
    <div className="flex overflow-x-auto scrollbar-hide border-b mb-4">
      <div className="flex min-w-full sm:min-w-0 gap-4">
        <TabButton 
          label="Synopsis"
          isActive={activeTab === 'synopsis'}
          onClick={() => setActiveTab('synopsis')}
        />
        <TabButton 
          label="Chapters"
          isActive={activeTab === 'chapters'}
          onClick={() => setActiveTab('chapters')}
        />
        <TabButton 
          label="Comments"
          isActive={activeTab === 'comments'}
          onClick={() => setActiveTab('comments')}
        />
        <TabButton 
          label="Recommendations"
          isActive={activeTab === 'recommendations'}
          onClick={() => setActiveTab('recommendations')}
        />
      </div>
    </div>

    {/* Tab Content */}
    {activeTab === 'synopsis' ? (
      <>
        {/* Description Card */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <div 
            className="prose prose-sm max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Novel Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <DetailItem label="Status" value={status} />
            <DetailItem label="Uploaded" value={formatDateMDY(createdAt)} />
            <DetailItem label="Updated" value={formatDateMDY(updatedAt)} />
          </div>
        </div>
      </>
    ) : activeTab === 'chapters' ? (
      <ChapterList
        chapters={chapters}
        novelId={novelId}
        novelSlug={novelSlug}
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        novelAuthorId={novelAuthorId}
      />
    ) : activeTab === 'recommendations' ? (
      <NovelRecommendations 
        novelId={novelId}
      />
    ) : activeTab === 'comments' ? (
      <NovelComments
        novelId={novelId}
        isAuthenticated={isAuthenticated}
      />
    ) : (
      <ChapterList
        chapters={chapters}
        novelId={novelId}
        novelSlug={novelSlug}
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        novelAuthorId={novelAuthorId}
      />
    )}
  </div>
  );
};

const StatsItem = ({ icon, value, color = 'gray' }: { icon: string; value: string; color?: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon 
      icon={icon} 
      className={`text-lg ${color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-gray-600'}`} 
    />
    <span className="text-gray-700">{value}</span>
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-500 min-w-[5rem]">{label}:</span>
    <span className="text-gray-900 font-medium">{value}</span>
  </div>
);

const ReadButton = ({ firstChapterNumber, novelSlug }: { firstChapterNumber?: number; novelSlug: string }) => {
  if (firstChapterNumber === undefined) return null;
  
  return (
    <Link 
      href={`/novels/${novelSlug}/chapters/c${firstChapterNumber}`}
      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white font-medium"
    >
      <Icon icon="pepicons-print:book" className="text-lg" />
      <span>Start Reading</span>
    </Link>
  );
};

const BookmarkButton = ({
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
}: {
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
}) => (
  <button 
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isBookmarkLoading) {
        onBookmarkClick();
      }
    }}
    type="button"
    disabled={isBookmarkLoading}
    aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
    className={`flex items-center text-black justify-center gap-1.5 px-4 py-2 rounded-lg transition-colors touch-manipulation ${
      !isAuthenticated 
        ? 'bg-gray-100 hover:bg-gray-200'
        : isBookmarked 
          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
          : 'bg-gray-100 hover:bg-gray-200'
    } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon 
      icon={isBookmarked ? "pepicons-print:bookmark-filled" : "pepicons-print:bookmark"} 
      className={`text-lg ${isBookmarkLoading ? 'animate-pulse' : ''}`}
    />
    <span className="font-medium text-black">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
  </button>
); 

const TabButton = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors relative ${
      isActive
        ? 'text-green-600'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {label}
    {isActive && (
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600" />
    )}
  </button>
); 