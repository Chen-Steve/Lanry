'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import supabase from '@/lib/supabaseClient';

// Minimum amount of coins purchased to qualify for ad-free experience
const AD_FREE_THRESHOLD = 50;

export const useAdFreeStatus = () => {
  const { userId, isAuthenticated } = useAuth();
  const [isAdFree, setIsAdFree] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdFreeStatus = async () => {
      if (!isAuthenticated || !userId) {
        setIsAdFree(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has 'isAdFree' field set to true first
        const { data: profile } = await supabase
          .from('profiles')
          .select('isAdFree')
          .eq('id', userId)
          .single();

        if (profile?.isAdFree) {
          setIsAdFree(true);
          setIsLoading(false);
          return;
        }

        // Otherwise check total coin purchases
        const { data: transactions, error: transactionError } = await supabase
          .from('coin_transactions')
          .select('amount')
          .eq('profile_id', userId)
          .eq('type', 'PURCHASE');

        if (transactionError) throw transactionError;

        // Calculate total coins purchased
        const totalCoinsPurchased = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
        
        // Set ad-free status based on threshold
        const shouldBeAdFree = totalCoinsPurchased >= AD_FREE_THRESHOLD;
        
        // Update the profile if user qualifies for ad-free
        if (shouldBeAdFree) {
          await supabase
            .from('profiles')
            .update({ isAdFree: true })
            .eq('id', userId);
        }
        
        setIsAdFree(shouldBeAdFree);
      } catch (error) {
        console.error('Error checking ad-free status:', error);
        setIsAdFree(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdFreeStatus();
  }, [isAuthenticated, userId]);

  return { isAdFree, isLoading };
}; 