import { Chapter, UserProfile } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ChapterListItemProps {
  chapter: Chapter;
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  coinCost?: number;
}

export function ChapterListItem({ 
  chapter, 
  novelSlug, 
  userProfile, 
  isAuthenticated,
  coinCost = 5
}: ChapterListItemProps) {
  const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
  
  const handleLockedChapterClick = () => {
    if (!isAuthenticated) {
      toast.error('Please create an account to unlock chapters', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    if (!userProfile) return;

    if (userProfile.coins < coinCost) {
      toast.error(`Not enough coins. You need ${coinCost} coins to unlock this chapter`, {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#EF4444',
          color: 'white',
          padding: '12px 24px',
        },
        icon: <Icon icon="material-symbols:payments-outline" className="text-xl" />,
      });
      return;
    }

    toast.success(`Unlock Chapter ${chapter.chapter_number} for ${coinCost} coins?`, {
      duration: 3000,
      position: 'bottom-center',
      style: {
        background: '#8B5CF6',
        color: 'white',
        padding: '12px 24px',
      },
      icon: <Icon icon="material-symbols:payments-outline" className="text-xl" />,
    });
  };

  const chapterContent = (
    <>
      <span className="inline-block min-w-[3rem]">Ch. {chapter.chapter_number}</span>
      {chapter.title && <span className="ml-2">{chapter.title}</span>}
    </>
  );

  return (
    <div className={`flex flex-col border-b border-gray-100 py-3 px-4 ${
      isPublished ? 'hover:bg-gray-50' : 'bg-gray-50/50'
    } transition-colors rounded-lg gap-2`}>
      <div className="flex-grow flex flex-col w-full gap-2">
        {!isPublished && chapter.publish_at ? (
          <>
            <div 
              className="text-gray-600 cursor-pointer"
              onClick={handleLockedChapterClick}
            >
              {chapterContent}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-purple-50 text-purple-800 px-2 py-1 rounded-md text-sm">
                <Icon icon="material-symbols:lock" className="text-lg" />
                <span className="font-medium">
                {formatDate(chapter.publish_at)} • {coinCost} coins
                  {userProfile && (
                    <span className="ml-2">
                      ({userProfile.coins} coins available)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </>
        ) : (
          <Link 
            href={`/novels/${novelSlug}/chapters/c${chapter.chapter_number}`}
            className="flex-grow flex flex-col sm:flex-row sm:items-center text-gray-600 gap-1 hover:text-gray-900"
          >
            <div className="flex items-center gap-2">
              {chapterContent}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
} 