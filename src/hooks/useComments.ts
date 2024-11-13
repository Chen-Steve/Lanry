'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import type { ChapterComment, CommentsByParagraph } from '@/types/database';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Type for our comment data
interface DatabaseComment {
  id: string;
  created_at: string;
  updated_at: string;
  chapter_number: number;
  paragraph_id: string;
  content: string;
  profile_id: string;
  profile?: {
    username: string;
  };
}

export function useComments(chapterNumber: number) {
  const [comments, setComments] = useState<CommentsByParagraph>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth setup
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('[Init] Error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUserId(null);
      } else if (session?.user) {
        setUserId(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Comments fetching and real-time updates
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`chapter-${chapterNumber}-comments`)
        .on(
          'postgres_changes' as `postgres_changes`,
          {
            event: '*',
            schema: 'public',
            table: 'chapter_comments',
            filter: `chapter_number=eq.${chapterNumber}`
          },
          (payload: RealtimePostgresChangesPayload<DatabaseComment>) => {
            if (payload.eventType === 'DELETE') return; // Skip delete events
            
            const newComment = payload.new;
            if (!newComment) return; // Skip if no new comment data

            setComments((prev) => ({
              ...prev,
              [newComment.paragraph_id]: [
                ...(prev[newComment.paragraph_id] || []),
                {
                  ...newComment,
                  profile: {
                    username: newComment.profile?.username || 'Anonymous'
                  }
                } as ChapterComment
              ]
            }));
          }
        )
        .subscribe();
    };

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('chapter_comments')
        .select(`
          *,
          profile:profiles (
            username
          )
        `)
        .eq('chapter_number', chapterNumber)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Group comments by paragraph
      const grouped = data.reduce((acc, comment) => {
        if (!acc[comment.paragraph_id]) {
          acc[comment.paragraph_id] = [];
        }
        acc[comment.paragraph_id].push(comment as ChapterComment);
        return acc;
      }, {} as CommentsByParagraph);

      setComments(grouped);
    };

    fetchComments();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [chapterNumber]);

  const addComment = async (paragraphId: string, content: string) => {
    if (!userId) return;

    try {
      // Generate UUID on client side
      const commentId = crypto.randomUUID();

      // Create the comment
      const { data, error } = await supabase
        .from('chapter_comments')
        .insert([{  // Note: Wrap in array
          id: commentId,
          chapter_number: chapterNumber,
          paragraph_id: paragraphId,
          content,
          profile_id: userId,
        }])
        .select(`
          *,
          profile:profiles (
            username
          )
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Optimistically update local state with the new comment
      const newComment: ChapterComment = {
        id: commentId,  // Use the generated ID
        content: data.content,
        profile_id: data.profile_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        chapter_number: data.chapter_number,
        paragraph_id: data.paragraph_id,
        profile: {
          username: data.profile.username || 'Anonymous'
        }
      };

      setComments((prev) => ({
        ...prev,
        [paragraphId]: [
          ...(prev[paragraphId] || []),
          newComment
        ]
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return { 
    comments, 
    addComment,
    isAuthenticated: !!userId,
    isLoading 
  };
} 