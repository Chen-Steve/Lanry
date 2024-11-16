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

export function useComments(novelId: string, chapterNumber: number) {
  const [comments, setComments] = useState<CommentsByParagraph>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simplified auth setup
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (supabaseSession?.user) {
            setUserId(supabaseSession.user.id);
          } else {
            setUserId(null);
          }
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
        .channel(`novel-${novelId}-chapter-${chapterNumber}-comments`)
        .on(
          'postgres_changes' as `postgres_changes`,
          {
            event: '*',
            schema: 'public',
            table: 'chapter_comments',
            filter: `novel_id=eq.${novelId},chapter_number=eq.${chapterNumber}`
          },
          (payload: RealtimePostgresChangesPayload<DatabaseComment>) => {
            if (payload.eventType === 'DELETE') return;
            
            const newComment = payload.new;
            if (!newComment) return;

            setComments((prev) => ({
              ...prev,
              [newComment.paragraph_id]: [
                ...(prev[newComment.paragraph_id] || []),
                {
                  ...newComment,
                  profile: {
                    username: newComment.profile?.username ?? 'Anonymous'
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
        .eq('novel_id', novelId)
        .eq('chapter_number', chapterNumber)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Group comments by paragraph with profile handling
      const grouped = data.reduce((acc, comment) => {
        if (!acc[comment.paragraph_id]) {
          acc[comment.paragraph_id] = [];
        }
        // Ensure each comment has a valid profile
        const processedComment = {
          ...comment,
          profile: {
            username: comment.profile?.username ?? 'Anonymous'
          }
        } as ChapterComment;
        
        acc[comment.paragraph_id].push(processedComment);
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
  }, [novelId, chapterNumber]);

  const addComment = async (paragraphId: string, content: string) => {
    if (!userId) return;

    try {
      const newComment = {
        id: crypto.randomUUID(),
        novel_id: novelId,
        chapter_number: chapterNumber,
        paragraph_id: paragraphId,
        content: content,
        profile_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chapter_comments')
        .insert(newComment)
        .select(`
          *,
          profile:profiles (
            username
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.log('Attempted to insert:', newComment);
        throw error;
      }

      // Update local state with profile handling
      setComments((prev) => ({
        ...prev,
        [paragraphId]: [
          ...(prev[paragraphId] || []),
          {
            ...data,
            profile: {
              username: data.profile?.username ?? 'Anonymous'
            }
          } as ChapterComment
        ]
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const isAuthenticated = !!userId;

  return { comments, addComment, isAuthenticated, isLoading };
} 