import { UserProfile } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { ChapterCountdown } from './ChapterCountdown';
import { useServerTimeContext } from '@/providers/ServerTimeProvider';

interface ChapterListItemProps {
  chapter: {
    id: string;
    chapter_number: number;
    part_number?: number | null;
    title: string;
    publish_at?: string | null;
    coins?: number;
    age_rating?: string;
    novel_id: string;
    content: string;
    created_at: string;
    slug: string;
    author_profile_id: string;
  };
  novelSlug: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  novelAuthorId: string;
  hasTranslatorAccess?: boolean;
  isUnlocked?: boolean;
  isPublished?: boolean;
}

export const ChapterListItem = memo(function ChapterListItem({ 
  chapter,
  novelSlug,
  userProfile,
  isAuthenticated,
  novelAuthorId,
  hasTranslatorAccess = false,
  isUnlocked = false,
  isPublished = false
}: ChapterListItemProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();
  const { getServerTime } = useServerTimeContext();

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
                  toast.dismiss(t);
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
                  toast.dismiss(t);
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

  // We need to check for indefinite lock first, before checking if it's free
  const isIndefinitelyLocked = chapter.publish_at && (() => {
    const publishDate = new Date(chapter.publish_at);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    return publishDate > fiftyYearsFromNow;
  })();
  
  // Only check for free status if not indefinitely locked
  const isFree = !isIndefinitelyLocked && (!chapter.coins || chapter.coins === 0);

  // Updated helper to check if chapter is advanced using server time
  const isAdvancedChapter = chapter.publish_at && 
                          new Date(chapter.publish_at) > getServerTime() && 
                          (chapter.coins ?? 0) > 0;

  // Add helper to check if chapter is extra
  const isExtraChapter = chapter.part_number === -1;

  const chapterContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
        <span className="font-medium whitespace-nowrap flex items-center gap-1">
          {!isPublished && !isFree && !isUnlocked && !hasTranslatorAccess && !isIndefinitelyLocked && (
            <Icon icon="material-symbols:lock" className="text-xs text-amber-500" />
          )}
          {isExtraChapter ? (
            <div className="flex items-center gap-1.5 text-purple-500 min-w-0">
              <Icon icon="solar:star-bold" className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium flex-shrink-0">Ch. {chapter.chapter_number} · Extra:</span>
              <span className="text-md truncate max-w-[120px]">{chapter.title}</span>
            </div>
          ) : (
            <>Ch. {chapter.chapter_number}{chapter.part_number ? `.${chapter.part_number}` : ''}</>
          )}
        </span>
        {chapter.title && !isExtraChapter && (
          <span className="text-sm truncate text-muted-foreground">
            {chapter.title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap flex-shrink-0 ml-2">
        {/* Show Translator Access badge when the viewer has translator access */}
        {isAdvancedChapter && hasTranslatorAccess ? (
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400">
              Translator Access
            </span>
            {chapter.age_rating === 'MATURE' && (
              <span 
                className="text-xs font-bold text-red-500 dark:text-red-400 relative group cursor-help"
                aria-label="18+ content"
              >
                M
                <span className="absolute hidden group-hover:block top-full right-0 mt-1 px-2 py-1 text-xs font-medium bg-black/90 text-white rounded whitespace-nowrap">
                  18+
                </span>
              </span>
            )}
          </div>
        ) : !isPublished && chapter.publish_at ? (
          isUnlocked ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Unlocked
            </span>
          ) : isFree ? (
            <span className="text-muted-foreground">Free</span>
          ) : isIndefinitelyLocked ? (
            <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
              <Icon icon="mdi:lock-clock" className="w-4 h-4" />
              Coming Soon
            </span>
          ) : (
            <>
              {isUnlocking ? (
                <Icon icon="material-symbols:progress-activity" className="text-foreground animate-spin" />
              ) : (
                <span>{chapter.coins}c</span>
              )}
              <span className="text-muted-foreground flex items-center gap-1">
                · <ChapterCountdown publishDate={chapter.publish_at} />
              </span>
              {chapter.age_rating === 'MATURE' && (
                <span 
                  className="text-xs font-bold text-red-500 dark:text-red-400 relative group cursor-help ml-1"
                  aria-label="18+ content"
                >
                  M
                  <span className="absolute hidden group-hover:block top-full right-0 mt-1 px-2 py-1 text-xs font-medium bg-black/90 text-white rounded whitespace-nowrap">
                    18+
                  </span>
                </span>
              )}
            </>
          )
        ) : (
          chapter.age_rating === 'MATURE' && (
            <span 
              className="text-xs font-bold text-red-500 dark:text-red-400 relative group cursor-help"
              aria-label="18+ content"
            >
              M
              <span className="absolute hidden group-hover:block top-full right-0 mt-1 px-2 py-1 text-xs font-medium bg-black/90 text-white rounded whitespace-nowrap">
                18+
              </span>
            </span>
          )
        )}
      </div>
    </div>
  );

  // Allow navigation for:
  // 1. Published chapters (regardless of coins) OR
  // 2. Free chapters OR
  // 3. Users with translator access OR
  // 4. Already unlocked chapters
  if (isPublished || isFree || hasTranslatorAccess || isUnlocked) {
    return (
      <Link
        href={`/novels/${novelSlug}/c${chapter.chapter_number}${chapter.part_number ? `-p${chapter.part_number}` : ''}`}
        prefetch={false}
        className="w-full hover:bg-accent/50 transition-colors"
      >
        {chapterContent}
      </Link>
    );
  }

  // Show purchase button for:
  // 1. Unpublished chapters with coins that aren't unlocked
  if (!isPublished && !isIndefinitelyLocked && (chapter.coins ?? 0) > 0 && !isUnlocked) {
    return (
      <button
        onClick={handleLockedChapterClick}
        disabled={isUnlocking}
        className="w-full text-left hover:bg-accent/50 transition-colors"
      >
        {chapterContent}
      </button>
    );
  }

  // For indefinitely locked chapters, render as non-interactive
  if (isIndefinitelyLocked) {
    return (
      <div className="w-full opacity-75 cursor-default">
        {chapterContent}
      </div>
    );
  }

  // For all other non-navigable chapters
  return (
    <div className="w-full opacity-50">
      {chapterContent}
    </div>
  );
}); 