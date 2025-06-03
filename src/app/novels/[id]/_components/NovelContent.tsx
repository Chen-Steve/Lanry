import { useState, useEffect } from 'react';
import { Chapter, NovelCategory, Tag } from '@/types/database';
import { NovelRecommendations } from './NovelRecommendations';
import { NovelComments } from './NovelComments';
import { NovelHeader } from './NovelHeader';
import { TabGroup } from '@/app/novels/[id]/_components/TabGroup';
import { TranslatorLinks } from './TranslatorLinks';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { NovelSynopsis } from './NovelSynopsis';

interface NovelContentProps {
  title: string;
  description: string;
  chaptersCount: number;
  bookmarkCount: number;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';
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
  novelId: string;
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
  novelId,
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
  const [activeTab, setActiveTab] = useState('support');
  const searchParams = useSearchParams();

  // Set initial active tab based on URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['chapters', 'comments', 'recommendations', 'support'].includes(tab)) {
      setActiveTab(tab);
    } else if (translator && (translator.kofiUrl || translator.patreonUrl || translator.customUrl)) {
      setActiveTab('support');
    } else {
      setActiveTab('comments');
    }
  }, [searchParams, translator]);

  const tabs = [
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
    <div className="max-w-5xl mx-auto px-4 py-4 bg-background">
      {showHeader && (
        <>
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
            hideDescription={true}
          />

          <div className="bg-container rounded-lg p-4 -mt-8 sm:mt-8">
            <NovelSynopsis
              description={description}
              characters={characters}
            />
            
            <div className="border-t border-black dark:border-gray-600 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <Link 
                  href={`/novels/${novelSlug}/chapters`}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-md text-black dark:text-white">{chapters.length} Chapters Updated</span>
                      <Icon icon="mdi:chevron-right" className="text-xl text-black dark:text-white" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-container rounded-lg p-6">
            <TabGroup
              tabs={tabs}
              value={activeTab}
              onChange={setActiveTab}
            />
            {renderTabContent()}
          </div>
        </>
      )}
    </div>
  );
};