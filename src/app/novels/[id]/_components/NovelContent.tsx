import { useState, useEffect } from 'react';
import { ChapterList } from './ChapterList';
import { Chapter, UserProfile, NovelCategory, Tag } from '@/types/database';
import { Volume } from '@/types/novel';
import { NovelRecommendations } from './NovelRecommendations';
import { NovelComments } from './NovelComments';
import { NovelHeader } from './NovelHeader';
import { TabGroup } from '@/app/novels/[id]/_components/TabGroup';
import { TranslatorLinks } from './TranslatorLinks';
import { useSearchParams } from 'next/navigation';

interface NovelContentProps {
  title: string;
  description: string;
  chaptersCount: number;
  bookmarkCount: number;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  ageRating?: 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';
  createdAt: string;
  updatedAt: string;
  author: string;
  translator?: { 
    username: string | null;
    profile_id: string;
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
    author_bio?: string;
  } | null;
  novelSlug: string;
  firstChapterNumber?: number;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
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

export const NovelContent = ({ 
  title,
  description, 
  bookmarkCount,
  ageRating = 'EVERYONE',
  author,
  translator,
  novelSlug,
  firstChapterNumber,
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
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
}: NovelContentProps) => {
  const [activeTab, setActiveTab] = useState('chapters');
  const searchParams = useSearchParams();

  // Set initial active tab based on URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['chapters', 'comments', 'recommendations', 'support'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { label: 'Chapters', value: 'chapters' },
    ...(translator && (translator.kofiUrl || translator.patreonUrl || translator.customUrl) ? [
      { 
        label: `About ${translator.username || 'Translator'}`, 
        value: 'support' 
      }
    ] : []),
    { label: 'Comments', value: 'comments' },
    { label: 'Recommendations', value: 'recommendations' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chapters':
        return (
          <ChapterList
            initialChapters={chapters}
            volumes={volumes}
            novelId={novelId}
            novelSlug={novelSlug}
            userProfile={userProfile}
            isAuthenticated={isAuthenticated}
            novelAuthorId={novelAuthorId}
          />
        );
      case 'recommendations':
        return (
          <NovelRecommendations 
            novelId={novelId}
          />
        );
      case 'comments':
        return (
          <NovelComments
            novelId={novelId}
            novelSlug={novelSlug}
            isAuthenticated={isAuthenticated}
          />
        );
      case 'support':
        return translator && (
          <div className="p-4 sm:p-6 flex justify-center">
            <TranslatorLinks translator={translator} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {showHeader && (
        <NovelHeader
          title={title}
          author={author}
          translator={translator}
          bookmarkCount={bookmarkCount}
          chapterCount={chapters.length}
          coverImageUrl={coverImageUrl}
          novelAuthorId={novelAuthorId}
          isAuthorNameCustom={isAuthorNameCustom}
          categories={categories}
          tags={tags}
          description={description}
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
          characters={characters}
        />
      )}

      <div className="mt-6">
        <TabGroup
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {renderTabContent()}
    </div>
  );
}; 