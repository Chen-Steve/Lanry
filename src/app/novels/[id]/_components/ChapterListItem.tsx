import { Chapter, UserProfile } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { ChapterCountdown } from './ChapterCountdown';

interface ChapterListItemProps {
  chapter: Chapter & {
    novel_id: string;
  };
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  novelAuthorId: string;
  hasTranslatorAccess?: boolean;
  isUnlocked?: boolean;
}

export const ChapterListItem = memo(function ChapterListItem({ 
  chapter, 
  novelSlug, 
  userProfile, 
  isAuthenticated,
  novelAuthorId,
  hasTranslatorAccess = false,
  isUnlocked = false,
}: ChapterListItemProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();

  const unlockChapter = useCallback(async (
    novelId: string,
    authorId: string,
    chapterNumber: number,
    partNumber: number | null | undefined,
    userProfileId: string
  ) => {
    try {
      const { data, error: transactionError } = await supabase.rpc(
        'process_chapter_purchase',
        {
          p_novel_id: novelId,
          p_author_id: authorId,
          p_chapter_number: chapterNumber,
          p_part_number: partNumber,
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

      toast.success('Chapter unlocked successfully!');
      router.push(`/novels/${novelSlug}/c${chapterNumber}${chapter.part_number ? `-p${chapter.part_number}` : ''}`);
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
  }, [chapter.coins, chapter.part_number, novelSlug, router]);

  const handleLockedChapterClick = useCallback(async () => {
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

      let query = supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('profile_id', userProfile.id)
        .eq('novel_id', chapter.novel_id)
        .eq('chapter_number', chapter.chapter_number);

      // Handle part_number separately based on whether it's null
      if (chapter.part_number === null) {
        query = query.is('part_number', null);
      } else {
        query = query.eq('part_number', chapter.part_number);
      }

      const { data: existingUnlock, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking unlock status:', error);
        return;
      }

      if (existingUnlock) {
        router.push(`/novels/${novelSlug}/c${chapter.chapter_number}${chapter.part_number ? `-p${chapter.part_number}` : ''}`);
        return;
      }

      toast.custom((t) => (
        <div className="bg-background shadow-lg rounded-lg p-4 max-w-md mx-auto border-2 border-primary">
          <div className="flex flex-col gap-3">
            <div className="font-medium text-foreground">
              Unlock Chapter {chapter.chapter_number}{chapter.part_number ? `.${chapter.part_number}` : ''} for {chapter.coins} coins?
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  await unlockChapter(
                    chapter.novel_id, 
                    novelAuthorId, 
                    chapter.chapter_number,
                    chapter.part_number,
                    userProfile.id
                  );
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
      setIsUnlocking(false);
    }
  }, [chapter.chapter_number, chapter.coins, chapter.novel_id, chapter.part_number, isAuthenticated, novelSlug, router, unlockChapter, userProfile?.id, novelAuthorId]);

  const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
  const isIndefinitelyLocked = chapter.publish_at && new Date(chapter.publish_at).getFullYear() > new Date().getFullYear() + 50;
  // A chapter is free if:
  // 1. It has no coins set, OR
  // 2. It was an advanced chapter that is now published
  const isFree = !chapter.coins || chapter.coins === 0 || (chapter.publish_at && isPublished);

  const chapterContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium whitespace-nowrap flex items-center gap-1">
          {(!isPublished || isIndefinitelyLocked) && !isUnlocked && !hasTranslatorAccess && (
            <Icon icon="material-symbols:lock" className="text-xs" />
          )}
          Ch. {chapter.chapter_number}{chapter.part_number ? `.${chapter.part_number}` : ''}
        </span>
        {chapter.title && (
          <span className="text-sm text-muted-foreground truncate">
            {chapter.title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        {!isPublished && chapter.publish_at ? (
          isUnlocked || hasTranslatorAccess ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              {hasTranslatorAccess ? 'Translator Access' : 'Unlocked'}
            </span>
          ) : isIndefinitelyLocked ? (
            <span className="text-muted-foreground">Coming Soon</span>
          ) : (
            <>
              {isUnlocking ? (
                <Icon icon="material-symbols:progress-activity" className="text-foreground animate-spin" />
              ) : (
                null
              )}
              <span>{chapter.coins}c</span>
              <span className="text-muted-foreground flex items-center gap-1">
                · <ChapterCountdown publishDate={chapter.publish_at} />
              </span>
            </>
          )
        ) : (
          chapter.age_rating === 'MATURE' && (
            <span 
              className="text-xs font-bold text-red-500 dark:text-red-400 relative group cursor-help"
              aria-label="18+ content"
            >
              H
              <span className="absolute hidden group-hover:block top-full right-0 mt-1 px-2 py-1 text-xs font-medium bg-black/90 text-white rounded whitespace-nowrap">
                18+
              </span>
            </span>
          )
        )}
      </div>
    </div>
  );

  // Only allow navigation if:
  // 1. Chapter is published AND either free or unlocked, OR
  // 2. User has translator access, OR
  // 3. Chapter is unlocked (regardless of publish status)
  if ((isPublished && !isIndefinitelyLocked && (isFree || isUnlocked)) || hasTranslatorAccess || isUnlocked) {
    return (
      <Link
        href={`/novels/${novelSlug}/c${chapter.chapter_number}${chapter.part_number ? `-p${chapter.part_number}` : ''}`}
        className="w-full hover:bg-accent/50 transition-colors"
      >
        {chapterContent}
      </Link>
    );
  }

  // For unpublished or paid chapters that aren't unlocked, show purchase button
  if (isPublished && !isIndefinitelyLocked && !isFree && !isUnlocked) {
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

  // For any other case (indefinitely locked or unpublished), render as non-interactive
  return (
    <div className="w-full opacity-50">
      {chapterContent}
    </div>
  );
}); 