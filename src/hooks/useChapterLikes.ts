import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';

interface UseChapterLikesProps {
  chapterNumber: number;
  novelId: string;
}

export function useChapterLikes({ chapterNumber, novelId }: UseChapterLikesProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLikes = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const response = await fetch(`/api/chapters/${chapterNumber}/likes?novelId=${novelId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Failed to fetch likes');

      const data = await response.json();
      setLikeCount(data.likeCount);
      setIsLiked(data.isLiked);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chapterNumber, novelId]);

  // Fetch likes on mount and when auth state changes
  useEffect(() => {
    fetchLikes();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchLikes();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLikes]);

  const toggleLike = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Must be logged in to like chapters');
      }

      const response = await fetch(`/api/chapters/${chapterNumber}/likes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ novelId })
      });

      if (!response.ok) throw new Error('Failed to toggle like');

      const data = await response.json();
      setLikeCount(data.likeCount);
      setIsLiked(data.isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  return {
    likeCount,
    isLiked,
    isLoading,
    toggleLike
  };
} 