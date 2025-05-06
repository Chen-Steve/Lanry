'use client';

import { useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListItem } from '@/services/chapterService';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface BulkPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  advancedChapters: ChapterListItem[];
  userProfileId?: string;
  novelId: string;
  novelAuthorId: string;
}

export const BulkPurchaseModal = ({
  isOpen,
  onClose,
  advancedChapters,
  userProfileId,
  novelId,
  novelAuthorId
}: BulkPurchaseModalProps) => {
  const [selectedChapters, setSelectedChapters] = useState<Map<string, ChapterListItem>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [userCoins, setUserCoins] = useState(0);

  // Reset selections when modal opens or chapters change
  useEffect(() => {
    if (isOpen) {
      setSelectedChapters(new Map());
      setTotalCost(0);
      fetchUserCoins();
    }
  }, [isOpen, advancedChapters]);

  const fetchUserCoins = useCallback(async () => {
    if (!userProfileId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userProfileId)
        .single();
      
      if (error) throw error;
      setUserCoins(data?.coins || 0);
    } catch (error) {
      console.error('Error fetching user coins:', error);
    }
  }, [userProfileId]);

  const toggleChapterSelection = useCallback((chapter: ChapterListItem) => {
    setSelectedChapters(prev => {
      const newSelections = new Map(prev);
      
      if (newSelections.has(chapter.id)) {
        newSelections.delete(chapter.id);
      } else {
        newSelections.set(chapter.id, chapter);
      }
      
      // Calculate total cost
      let total = 0;
      newSelections.forEach(ch => {
        total += ch.coins || 0;
      });
      setTotalCost(total);
      
      return newSelections;
    });
  }, []);

  const selectAllChapters = useCallback(() => {
    if (selectedChapters.size === advancedChapters.length) {
      // Deselect all if all are currently selected
      setSelectedChapters(new Map());
      setTotalCost(0);
    } else {
      // Select all chapters
      const newSelections = new Map();
      let total = 0;
      
      advancedChapters.forEach(chapter => {
        newSelections.set(chapter.id, chapter);
        total += chapter.coins || 0;
      });
      
      setSelectedChapters(newSelections);
      setTotalCost(total);
    }
  }, [advancedChapters, selectedChapters.size]);

  const processFirstChapter = useCallback(async () => {
    if (selectedChapters.size === 0 || !userProfileId) return false;
    
    const firstChapter = Array.from(selectedChapters.values())[0];
    
    try {
      const { data, error: transactionError } = await supabase.rpc(
        'process_chapter_purchase',
        {
          p_novel_id: novelId,
          p_author_id: novelAuthorId,
          p_chapter_number: firstChapter.chapter_number,
          p_part_number: firstChapter.part_number,
          p_user_id: userProfileId,
          p_cost: firstChapter.coins
        }
      );

      if (transactionError) {
        throw new Error(transactionError.message || 'Failed to process purchase');
      }

      if (data && !data.success) {
        throw new Error(data.message || 'Failed to process purchase');
      }
      
      return true;
    } catch (error) {
      console.error('Error processing first chapter:', error);
      throw error;
    }
  }, [novelId, novelAuthorId, selectedChapters, userProfileId]);

  const processBulkPurchase = useCallback(async () => {
    if (selectedChapters.size === 0 || !userProfileId) return;
    
    if (totalCost > userCoins) {
      toast.error("You don't have enough coins for this purchase");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Process chapters one by one
      // First try to process the first chapter to validate the transaction
      await processFirstChapter();
      
      // If first transaction succeeds, process the rest
      const chapters = Array.from(selectedChapters.values());
      let failedChapters = 0;
      
      for (let i = 1; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        try {
          const { data, error: transactionError } = await supabase.rpc(
            'process_chapter_purchase',
            {
              p_novel_id: novelId,
              p_author_id: novelAuthorId,
              p_chapter_number: chapter.chapter_number,
              p_part_number: chapter.part_number,
              p_user_id: userProfileId,
              p_cost: chapter.coins
            }
          );

          if (transactionError || (data && !data.success)) {
            failedChapters++;
          }
        } catch (error) {
          console.error(`Error purchasing chapter ${chapter.chapter_number}:`, error);
          failedChapters++;
        }
      }
      
      if (failedChapters > 0) {
        toast.success(`Purchased ${chapters.length - failedChapters} out of ${chapters.length} chapters. Some chapters could not be processed.`);
      } else {
        toast.success(`Successfully purchased ${chapters.length} chapters!`);
      }
      
      // Close modal and refresh user coins
      onClose();
      window.location.reload(); // Refresh the page to show updated chapter status
    } catch (error) {
      console.error('Bulk purchase error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Insufficient coins')) {
          toast.error('You don\'t have enough coins to unlock these chapters');
        } else {
          toast.error(error.message || 'Failed to process bulk purchase');
        }
      } else {
        toast.error('Failed to process bulk purchase');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [novelId, novelAuthorId, onClose, processFirstChapter, selectedChapters, totalCost, userCoins, userProfileId]);

  // Format chapter title
  const formatChapterTitle = (chapter: ChapterListItem) => {
    const partLabel = chapter.part_number ? `.${chapter.part_number}` : '';
    return `Ch. ${chapter.chapter_number}${partLabel}${chapter.title ? ` - ${chapter.title}` : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-medium">Purchase Advanced Chapters</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Select chapters (Your coins: <span className="font-medium">{userCoins}</span>)
            </p>
            <button
              onClick={selectAllChapters}
              className="text-sm text-primary hover:text-primary/90 transition-colors"
            >
              {selectedChapters.size === advancedChapters.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {advancedChapters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon icon="solar:empty-file-linear" className="w-12 h-12 mx-auto mb-2" />
              <p>No advanced chapters available</p>
            </div>
          ) : (
            advancedChapters.map(chapter => (
              <div
                key={chapter.id}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                  selectedChapters.has(chapter.id)
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-border hover:bg-accent/50'
                }`}
                onClick={() => toggleChapterSelection(chapter)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectedChapters.has(chapter.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  }`}>
                    {selectedChapters.has(chapter.id) && (
                      <Icon icon="solar:check-linear" className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{formatChapterTitle(chapter)}</p>
                    {chapter.publish_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon icon="solar:calendar-linear" className="w-3 h-3" />
                        Available on: {new Date(chapter.publish_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-primary font-medium">
                  {chapter.coins} coins
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Total Cost</p>
              <p className="text-sm text-muted-foreground">
                {selectedChapters.size} chapters selected
              </p>
            </div>
            <div className="text-xl font-bold text-primary">
              {totalCost} coins
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={processBulkPurchase}
              disabled={selectedChapters.size === 0 || isProcessing || totalCost > userCoins}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Icon icon="solar:refresh-circle-linear" className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon icon="solar:cart-3-linear" className="w-5 h-5" />
                  Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 