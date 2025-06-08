'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';

interface ChapterPurchaseButtonProps {
  novelId: string;
  chapterNumber: number;
  partNumber?: number | null;
  coins: number;
  authorId: string;
  userProfileId?: string;
  isAuthenticated: boolean;
  publishAt?: string;
}

export default function ChapterPurchaseButton({
  novelId,
  chapterNumber,
  partNumber,
  coins,
  authorId,
  userProfileId,
  isAuthenticated,
  publishAt
}: ChapterPurchaseButtonProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  const unlockChapter = useCallback(async () => {
    try {
      // First, get the actual novel ID if we're using a slug
      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .select('id')
        .or(`id.eq.${novelId},slug.eq.${novelId}`)
        .single();

      if (novelError || !novel) {
        console.error('Error getting novel:', novelError);
        throw new Error('Failed to find novel');
      }

      const { data, error: transactionError } = await supabase.rpc(
        'process_chapter_purchase',
        {
          p_novel_id: novel.id,
          p_author_id: authorId,
          p_chapter_number: chapterNumber,
          p_part_number: partNumber,
          p_user_id: userProfileId,
          p_cost: coins
        }
      );

      if (transactionError) {
        throw new Error(transactionError.message || 'Failed to process purchase');
      }

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to process purchase');
      }

      toast.success('Chapter unlocked successfully!');
      
      // Navigate to the chapter page
      const partSuffix = partNumber ? `-p${partNumber}` : '';
      window.location.href = `/novels/${novelId}/c${chapterNumber}${partSuffix}`;
      
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
  }, [novelId, authorId, chapterNumber, partNumber, userProfileId, coins]);

  // Check if the chapter is indefinitely locked
  const isIndefinitelyLocked = publishAt && new Date(publishAt).getFullYear() > new Date().getFullYear() + 50;

  if (isIndefinitelyLocked) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-accent/50 rounded-lg text-center">
          <Icon icon="mdi:clock-outline" className="text-2xl text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Coming Soon</p>
          <p className="text-xs text-muted-foreground mt-1">This chapter is not yet available</p>
        </div>
      </div>
    );
  }

  const handleUnlock = async () => {
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

    if (!userProfileId) {
      toast.error('User profile not found');
      return;
    }

    try {
      setIsUnlocking(true);

      // First, get the actual novel ID if we're using a slug
      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .select('id')
        .or(`id.eq.${novelId},slug.eq.${novelId}`)
        .single();

      if (novelError || !novel) {
        console.error('Error getting novel:', novelError);
        throw new Error('Failed to find novel');
      }

      // Check if chapter is already unlocked
      let query = supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('profile_id', userProfileId)
        .eq('novel_id', novel.id)
        .eq('chapter_number', chapterNumber);

      // Handle part_number separately based on whether it's null
      if (partNumber === null) {
        query = query.is('part_number', null);
      } else {
        query = query.eq('part_number', partNumber);
      }

      const { data: existingUnlock, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking unlock status:', error);
        return;
      }

      if (existingUnlock) {
        // If already unlocked, just navigate to the chapter
        const partSuffix = partNumber ? `-p${partNumber}` : '';
        window.location.href = `/novels/${novelId}/c${chapterNumber}${partSuffix}`;
        return;
      }

      // Show confirmation dialog
      toast.custom((t) => (
        <div className="bg-background shadow-lg rounded-lg p-4 max-w-md mx-auto border-2 border-primary">
          <div className="flex flex-col gap-3">
            <div className="font-medium text-foreground">
              Unlock Chapter {chapterNumber}{partNumber ? `.${partNumber}` : ''} for {coins} coins?
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  await unlockChapter();
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
      console.error('Error in handleUnlock:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <button
      onClick={handleUnlock}
      disabled={isUnlocking}
      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isUnlocking ? (
        <>
          <Icon icon="mdi:loading" className="animate-spin text-xl" />
          <span>Unlocking...</span>
        </>
      ) : (
        <>
          <Icon icon="ph:coins" className="text-xl" />
          <span>{coins} coins</span>
        </>
      )}
    </button>
  );
}