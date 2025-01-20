import { formatText } from '@/lib/textFormatting';
import { useState } from 'react';
import { ChapterList } from './ChapterList';
import { Chapter, UserProfile, NovelCategory, Tag } from '@/types/database';
import { Volume } from '@/types/novel';
import { NovelRecommendations } from './NovelRecommendations';
import { NovelComments } from './NovelComments';
import { NovelHeader } from './NovelHeader';
import Image from 'next/image';

interface SynopsisSectionProps {
  title: string;
  description: string;
  chaptersCount: number;
  bookmarkCount: number;
  viewCount: number;
  ageRating?: 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';
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
  characters?: {
    id: string;
    name: string;
    role: string;
    imageUrl: string;
    description?: string | null;
    orderIndex: number;
  }[];
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
  ageRating = 'EVERYONE',
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
  characters = [],
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
          {/* Characters Card */}
          {characters && characters.length > 0 && (
            <div className="bg-card rounded-lg border border-border mb-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className="relative bg-white dark:bg-gray-800 overflow-hidden"
                  >
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={character.imageUrl}
                        alt={character.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 25vw, (max-width: 768px) 12.5vw, 10vw"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                        <p className="text-xs font-medium text-white leading-tight truncate">
                          {character.name}
                        </p>
                        <p className="text-[10px] text-gray-300 leading-tight truncate">
                          {character.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-4">
            <div 
              className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert [&>p]:mb-4 [&>p:last-child]:mb-0 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: formatText(description) }}
            />
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