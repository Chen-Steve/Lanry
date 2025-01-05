import { Chapter, UserProfile } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

interface ChapterListItemProps {
  chapter: Chapter & {
    novel_id: string;
  };
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  novelAuthorId: string;
}

export function ChapterListItem({ 
  chapter, 
  novelSlug, 
  userProfile, 
  isAuthenticated,
  novelAuthorId,
}: ChapterListItemProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!userProfile?.id || !chapter.novel_id) return;
      
      try {
        const { data: existingUnlock, error } = await supabase
          .from('chapter_unlocks')
          .select('id')
          .eq('profile_id', userProfile.id)
          .eq('novel_id', chapter.novel_id)
          .eq('chapter_number', chapter.chapter_number)
          .maybeSingle();

        if (error) {
          console.error('Error checking unlock status:', error);
          return;
        }

        setIsUnlocked(!!existingUnlock);
      } catch (error) {
        console.error('Error in checkUnlockStatus:', error);
      }
    };

    checkUnlockStatus();
  }, [userProfile?.id, chapter.novel_id, chapter.chapter_number]);

  const unlockChapter = async (
    novelId: string,
    authorId: string,
    chapterNumber: number,
    userProfileId: string
  ) => {
    try {
      const { data, error: transactionError } = await supabase.rpc(
        'process_chapter_purchase',
        {
          p_novel_id: novelId,
          p_author_id: authorId,
          p_chapter_number: chapterNumber,
          p_user_id: userProfileId,
          p_cost: chapter.coins
        }
      );

      if (transactionError) {
        throw new Error(transactionError.message || 'Failed to process purchase');
      }

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to process purchase');
      }

      setIsUnlocked(true);
      toast.success('Chapter unlocked successfully!');
      router.push(`/novels/${novelSlug}/c${chapterNumber}`);
      return true;
    } catch (error) {
      console.error('Unlock error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Insufficient coins')) {
          toast.error('You don\'t have enough coins to unlock this chapter');
        } else if (error.message.includes('Invalid UUID')) {
          toast.error('Invalid data format. Please try again.');
        } else {
          toast.error(error.message || 'Failed to unlock chapter. Please try again.');
        }
      } else {
        toast.error('Failed to unlock chapter. Please try again.');
      }
      throw error;
    }
  };

  const handleLockedChapterClick = async () => {
    if (!isAuthenticated) {
      toast.error('Please create an account to unlock advance chapters', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#F87171',
          color: 'white',
          padding: '16px',
        },
      });
      return;
    }

    if (!userProfile?.id || !chapter.novel_id) {
      console.error('Missing required data:', { userId: userProfile?.id, novelId: chapter.novel_id });
      return;
    }

    try {
      setIsUnlocking(true);

      const { data: existingUnlock, error } = await supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('profile_id', userProfile.id)
        .eq('novel_id', chapter.novel_id)
        .eq('chapter_number', chapter.chapter_number)
        .maybeSingle();

      if (error) {
        console.error('Error checking unlock status:', error);
        return;
      }

      if (existingUnlock) {
        router.push(`/novels/${novelSlug}/c${chapter.chapter_number}`);
        return;
      }

      toast.custom((t) => (
        <div className="bg-background shadow-lg rounded-lg p-4 max-w-md mx-auto border-2 border-primary">
          <div className="flex flex-col gap-3">
            <div className="font-medium text-foreground">
              Unlock Chapter {chapter.chapter_number} for {chapter.coins} coins?
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  await unlockChapter(chapter.novel_id, novelAuthorId, chapter.chapter_number, userProfile.id);
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  setIsUnlocking(false);
                }}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
      });

    } catch (error) {
      console.error('Error in handleLockedChapterClick:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      if (!isUnlocked) {
        setIsUnlocking(false);
      }
    }
  };

  const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();

  const formatPublishDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`;
  };

  const chapterContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium whitespace-nowrap flex items-center gap-1">
          {!isPublished && !isUnlocked && (
            <Icon icon="material-symbols:lock" className="text-xs" />
          )}
          Ch. {chapter.chapter_number}
        </span>
        {chapter.title && (
          <span className="text-sm text-muted-foreground truncate">
            {chapter.title}
          </span>
        )}
      </div>
      {!isPublished && chapter.publish_at && (
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          {isUnlocked ? (
            <span className="text-emerald-600 dark:text-emerald-400">Unlocked</span>
          ) : (
            <>
              {isUnlocking ? (
                <Icon icon="material-symbols:progress-activity" className="text-foreground animate-spin" />
              ) : (
                null
              )}
              <span>{chapter.coins}c</span>
              <span className="text-muted-foreground">
                · unlocks {formatPublishDate(chapter.publish_at)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (!isPublished && !isUnlocked) {
    return (
      <button
        onClick={handleLockedChapterClick}
        disabled={isUnlocking}
        className="w-full text-left"
      >
        {chapterContent}
      </button>
    );
  }

  return (
    <Link
      href={`/novels/${novelSlug}/c${chapter.chapter_number}`}
      className="w-full hover:bg-accent/50 transition-colors"
    >
      {chapterContent}
    </Link>
  );
} 