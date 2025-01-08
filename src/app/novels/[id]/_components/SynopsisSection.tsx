import { formatDateMDY } from '@/lib/utils';
import { formatText } from '@/lib/textFormatting';
import { useState } from 'react';
import { ChapterList } from './ChapterList';
import { Chapter, UserProfile, NovelCategory, Tag } from '@/types/database';
import { Volume } from '@/types/novel';
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
  ageRating?: 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';
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
  volumes?: Volume[];
  novelId: string;
  userProfile: UserProfile | null;
  novelAuthorId: string;
  rating: number;
  ratingCount: number;
  userRating?: number;
  translatorId?: string;
  isAuthorNameCustom?: boolean;
  categories?: NovelCategory[];
  tags?: Tag[];
  showHeader?: boolean;
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
        ? 'text-primary border-b-2 border-primary' 
        : 'text-muted-foreground hover:text-foreground'
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
  ageRating = 'EVERYONE',
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
  volumes = [],
  novelId,
  userProfile,
  novelAuthorId,
  rating = 0,
  ratingCount = 0,
  userRating,
  isAuthorNameCustom = true,
  categories,
  tags,
  showHeader = true,
}: SynopsisSectionProps) => {
  const [activeTab, setActiveTab] = useState<'synopsis' | 'chapters' | 'recommendations' | 'comments'>('synopsis');

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Header Section */}
      {showHeader && (
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
          tags={tags}
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
          ageRating={ageRating}
        />
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border mb-4">
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
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4">
            <div 
              className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert [&>p]:mb-4 [&>p:last-child]:mb-0 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: formatText(description) }}
            />
          </div>

          {/* Details Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="font-semibold text-foreground mb-2">Novel Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <DetailItem label="Status" value={status} />
              <DetailItem label="Age Rating" value={ageRating} />
              <DetailItem label="Uploaded" value={formatDateMDY(createdAt)} />
              <DetailItem label="Updated" value={formatDateMDY(updatedAt)} />
            </div>
          </div>
        </>
      ) : activeTab === 'chapters' ? (
        <ChapterList
          chapters={chapters}
          volumes={volumes}
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
          volumes={volumes}
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
    <span className="text-muted-foreground min-w-[5rem]">{label}:</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
); 