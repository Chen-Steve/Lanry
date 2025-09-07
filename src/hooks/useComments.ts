'use client';

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import type { ChapterComment, CommentsByParagraph } from '@/types/database';
import { generateUUID } from '@/lib/utils';
import { useSupabase } from '@/app/providers';

export function useComments(novelId: string, chapterNumber: number) {
  const { user, isLoading } = useSupabase();
  const [comments, setComments] = useState<CommentsByParagraph>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [user]);

  // ------------------------------------------------------------
  // Comments fetching (single fetch, no realtime)
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('chapter_comments')
      .select(`
        *,
        profile:profiles (
          username,
          avatar_url,
          role
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

      const processedComment = {
        ...comment,
        profile: {
          username: comment.profile?.username ?? 'Anonymous',
          avatar_url: comment.profile?.avatar_url,
          role: comment.profile?.role ?? 'USER'
        }
      } as ChapterComment;

      acc[comment.paragraph_id].push(processedComment);
      return acc;
    }, {} as CommentsByParagraph);

    setComments(grouped);
  }, [novelId, chapterNumber]);

  // Fetch once when chapter changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (paragraphId: string, content: string) => {
    if (!userId) return;

    try {
      const newComment = {
        id: generateUUID(),
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
            username,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) {
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
              username: data.profile?.username ?? 'Anonymous',
              avatar_url: data.profile?.avatar_url,
              role: data.profile?.role ?? 'USER'
            }
          } as ChapterComment
        ]
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('chapter_comments')
        .delete()
        .eq('id', commentId)
        .eq('profile_id', userId);

      if (error) throw error;

      // Update local state by removing the deleted comment from all paragraphs
      setComments(prevComments => {
        const newComments = { ...prevComments };
        for (const paragraphId in newComments) {
          newComments[paragraphId] = newComments[paragraphId].filter(
            comment => comment.id !== commentId
          );
        }
        return newComments;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('chapter_comments')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('profile_id', userId)
        .select(`
          *,
          profile:profiles (
            username,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;

      // Update local state by updating the comment in all paragraphs
      setComments(prevComments => {
        const newComments = { ...prevComments };
        for (const paragraphId in newComments) {
          newComments[paragraphId] = newComments[paragraphId].map(comment => 
            comment.id === commentId 
              ? {
                  ...comment,
                  content,
                  profile: {
                    username: data.profile?.username ?? 'Anonymous',
                    avatar_url: data.profile?.avatar_url,
                    role: data.profile?.role ?? 'USER'
                  }
                }
              : comment
          );
        }
        return newComments;
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  const isAuthenticated = !!userId;

  return { comments, addComment, deleteComment, updateComment, isAuthenticated, isLoading, userId };
} 