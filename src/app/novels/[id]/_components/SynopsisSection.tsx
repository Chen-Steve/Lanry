import { formatDateMDY } from '@/lib/utils';
import { useState } from 'react';
import { ChapterList } from './ChapterList';
import { Chapter, UserProfile, NovelCategory } from '@/types/database';
import { NovelRecommendations } from './NovelRecommendations';
import { NovelComments } from './NovelComments';
import { NovelHeader } from './NovelHeader';

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
  translator?: { 
    username: string | null;
    profile_id: string;
  } | null;
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
  rating: number;
  ratingCount: number;
  userRating?: number;
  translatorId?: string;
  isAuthorNameCustom?: boolean;
  categories?: NovelCategory[];
}

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
    className={`px-3 py-1.5 font-medium text-sm transition-colors whitespace-nowrap
      ${isActive 
        ? 'text-blue-600 border-b-2 border-blue-600' 
        : 'text-gray-600 hover:text-gray-900'
      }`}
  >
    {label}
  </button>
);

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
  rating = 0,
  ratingCount = 0,
  userRating,
  isAuthorNameCustom = true,
  categories,
}: SynopsisSectionProps) => {
  const [activeTab, setActiveTab] = useState<'synopsis' | 'chapters' | 'recommendations' | 'comments'>('synopsis');

  return (
  <div className="max-w-5xl mx-auto px-4 py-4">
    {/* Header Section */}
    <NovelHeader
      title={title}
      author={author}
      translator={translator}
      chaptersCount={chaptersCount}
      bookmarkCount={bookmarkCount}
      viewCount={viewCount}
      coverImageUrl={coverImageUrl}
      novelAuthorId={novelAuthorId}
      isAuthorNameCustom={isAuthorNameCustom}
      categories={categories}
      showActionButtons={showActionButtons}
      firstChapterNumber={firstChapterNumber}
      novelSlug={novelSlug}
      isAuthenticated={isAuthenticated}
      isBookmarked={isBookmarked}
      isBookmarkLoading={isBookmarkLoading}
      onBookmarkClick={onBookmarkClick}
      rating={rating}
      ratingCount={ratingCount}
      userRating={userRating}
      novelId={novelId}
    />

    {/* Tab Navigation */}
    <div className="flex overflow-x-auto scrollbar-hide border-b mb-4">
      <div className="flex min-w-full sm:min-w-0 gap-2">
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

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-500 min-w-[5rem]">{label}:</span>
    <span className="text-gray-900 font-medium">{value}</span>
  </div>
); 