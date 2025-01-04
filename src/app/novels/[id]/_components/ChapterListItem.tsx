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
  // console.log('Chapter data:', {
  //   chapterNumber: chapter.chapter_number,
  //   partNumber: chapter.part_number,
  //   title: chapter.title
  // });

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();

  // const chapterTitle = `Chapter ${chapter.chapter_number}${
  //   chapter.part_number ? ` Part ${chapter.part_number}` : ''
  // }${chapter.title ? `: ${chapter.title}` : ''}`;

  // console.log('Formatted chapter title:', chapterTitle);

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
      // Start a Supabase transaction
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

      console.log('Transaction response:', { data, error: transactionError });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error(transactionError.message || 'Failed to process purchase');
      }

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to process purchase');
      }

      // After successful transaction, update local state and redirect
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
          console.error('Invalid UUID error:', { novelId, authorId, userProfileId });
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
    // console.log('Chapter clicked:', {
    //   isPublished: !chapter.publish_at || new Date(chapter.publish_at) <= new Date(),
    //   isAuthenticated,
    //   userProfile: userProfile?.id,
    //   chapterId: chapter.id,
    //   publishAt: chapter.publish_at
    // });
    
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
        <div className="bg-background shadow-lg rounded-lg p-4 max-w-md mx-auto border border-border">
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
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const chapterContent = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-block min-w-[3rem] text-sm sm:text-base text-foreground">
          Chapter {chapter.chapter_number}
          {chapter.part_number && (
            <span className="text-muted-foreground">
              {" "}Part {chapter.part_number}
            </span>
          )}
          {chapter.title && (
            <span className="text-muted-foreground ml-1">: {chapter.title}</span>
          )}
        </span>
      </div>
      {!isPublished && chapter.publish_at && (
        <div className="flex flex-col gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-[0.6rem] sm:text-[0.6rem] mt-1 sm:mt-0 sm:ml-auto">
          <div className="flex items-center gap-1 justify-center">
            {isUnlocked ? (
              <span className="text-emerald-600 dark:text-emerald-400">Unlocked</span>
            ) : (
              <>
                {isUnlocking ? (
                  <Icon icon="pepicons-print:spinner" className="text-foreground text-xs animate-spin" />
                ) : (
                  <Icon icon="pepicons-print:lock" className="text-xs" />
                )}
                <span>{chapter.coins} coins</span>
              </>
            )}
          </div>
          <div>
            Available {formatPublishDate(chapter.publish_at)}
          </div>
        </div>
      )}
    </div>
  );

  if (!isPublished && !isUnlocked) {
    return (
      <button
        onClick={handleLockedChapterClick}
        disabled={isUnlocking}
        className="w-full text-left p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
      >
        {chapterContent}
      </button>
    );
  }

  return (
    <Link
      href={`/novels/${novelSlug}/c${chapter.chapter_number}`}
      className="block p-3 rounded-lg hover:bg-accent transition-colors"
    >
      {chapterContent}
    </Link>
  );
} 