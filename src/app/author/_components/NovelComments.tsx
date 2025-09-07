'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import { formatRelativeDate } from '@/lib/utils';
import type { Comment } from '@/app/author/_types/authorTypes';
import Link from 'next/link';
import Select from '@/components/ui/select';
import { useSupabase } from '@/app/providers';

type RawComment = {
  id: string;
  content: string;
  created_at: string;
  chapter_number?: number;
  part_number?: number | null;
  novel_id: string;
  paragraph_id?: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
    role: string;
  };
  novel: {
    title: string;
    author_profile_id: string;
    slug: string;
  };
  chapter?: {
    chapter_number: number;
    part_number?: number | null;
    novel_id: string;
    novel: {
      title: string;
      slug: string;
    };
  };
};

// Helper function to extract paragraph number from paragraph_id
const extractParagraphNumber = (paragraphId: string): number | null => {
  const match = paragraphId.match(/^p-(\d+)$/);
  return match ? parseInt(match[1]) + 1 : null; // Add 1 since paragraphs are 0-indexed
};

export default function NovelComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNovel, setSelectedNovel] = useState<string>('all');
  const [novels, setNovels] = useState<{ id: string; title: string }[]>([]);
  const [commentType, setCommentType] = useState<'all' | 'novel' | 'chapter' | 'paragraph'>('all');
  const { user } = useSupabase();

  useEffect(() => {
    const fetchNovels = async () => {
      if (!user) return;

      const { data: userNovels } = await supabase
        .from('novels')
        .select('id, title')
        .eq('author_profile_id', user.id);

      if (userNovels) {
        setNovels(userNovels);
      }
    };

    fetchNovels();
  }, [user]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        if (!user) {
          setIsLoading(false);
          return;
        }

        const promises = [];

        // Fetch paragraph comments if needed
        if (commentType === 'all' || commentType === 'paragraph') {
          const paragraphQuery = supabase
            .from('chapter_comments')
            .select(`
              id,
              content,
              created_at,
              chapter_number,
              novel_id,
              paragraph_id,
              profile:profiles (
                username,
                avatar_url,
                role
              ),
              novel:novels!inner (
                title,
                author_profile_id,
                slug
              )
            `)
            .eq('novel.author_profile_id', user.id)
            .order('created_at', { ascending: false });

          if (selectedNovel !== 'all') {
            paragraphQuery.eq('novel_id', selectedNovel);
          }

          promises.push(paragraphQuery);
        }

        // Fetch chapter thread comments if needed
        if (commentType === 'all' || commentType === 'chapter') {
          const threadQuery = supabase
            .from('chapter_thread_comments')
            .select(`
              id,
              content,
              created_at,
              chapter:chapters!inner (
                chapter_number,
                part_number,
                novel_id,
                novel:novels!inner (
                  title,
                  author_profile_id,
                  slug
                )
              ),
              profile:profiles (
                username,
                avatar_url,
                role
              )
            `)
            .eq('chapter.novel.author_profile_id', user.id)
            .order('created_at', { ascending: false });

          if (selectedNovel !== 'all') {
            threadQuery.eq('chapter.novel_id', selectedNovel);
          }

          promises.push(threadQuery);
        }

        // Fetch novel comments if needed
        if (commentType === 'all' || commentType === 'novel') {
          const novelQuery = supabase
            .from('novel_comments')
            .select(`
              id,
              content,
              created_at,
              novel_id,
              profile:profiles (
                username,
                avatar_url,
                role
              ),
              novel:novels!inner (
                title,
                author_profile_id,
                slug
              )
            `)
            .eq('novel.author_profile_id', user.id)
            .order('created_at', { ascending: false });

          if (selectedNovel !== 'all') {
            novelQuery.eq('novel_id', selectedNovel);
          }

          promises.push(novelQuery);
        }

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
          console.error('Error fetching comments:', errors);
          setComments([]);
          setIsLoading(false);
          return;
        }

        // Transform and combine the comments
        const allComments = results.flatMap((result) => {
          if (!result.data) return [];
          
          const comments = result.data as unknown as RawComment[];
          return comments.map(comment => {
            // For thread comments with chapter data
            if (comment.chapter && 'novel' in comment.chapter) {
              return {
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                novel_id: comment.chapter.novel_id,
                chapter_number: comment.chapter.chapter_number,
                part_number: comment.chapter.part_number,
                user: {
                  username: comment.profile.username || 'Anonymous',
                  avatar_url: comment.profile.avatar_url || ''
                },
                chapter: {
                  title: `Chapter ${comment.chapter.chapter_number}${comment.chapter.part_number ? `.${comment.chapter.part_number}` : ''} Discussion`,
                  novel: {
                    title: comment.chapter.novel.title,
                    slug: comment.chapter.novel.slug
                  }
                }
              } satisfies Comment;
            }
            
            // For paragraph comments and novel comments
            return {
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              novel_id: comment.novel_id,
              chapter_number: comment.chapter_number,
              part_number: comment.part_number || null,
              paragraph_id: comment.paragraph_id,
              user: {
                username: comment.profile.username || 'Anonymous',
                avatar_url: comment.profile.avatar_url || ''
              },
              chapter: {
                title: comment.paragraph_id 
                  ? `Chapter ${comment.chapter_number} (Paragraph ${extractParagraphNumber(comment.paragraph_id)})`
                  : comment.chapter_number 
                    ? `Chapter ${comment.chapter_number}` 
                    : 'Novel Comment',
                novel: {
                  title: comment.novel.title,
                  slug: comment.novel.slug
                }
              }
            } satisfies Comment;
          });
        });

        // Sort all comments by date
        const sortedComments = allComments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setComments(sortedComments);
      } catch (error) {
        console.error('Error in fetchComments:', error);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [selectedNovel, commentType, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Comments
          <span className="text-lg text-muted-foreground">({comments.length})</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select
            value={commentType}
            onChange={(value) => setCommentType(value as 'all' | 'novel' | 'chapter' | 'paragraph')}
            options={[
              { value: 'all', label: 'All Comments' },
              { value: 'novel', label: 'Novel Comments' },
              { value: 'chapter', label: 'Chapter Discussion' },
              { value: 'paragraph', label: 'Paragraph Comments' }
            ]}
            className="w-full sm:w-48"
            aria-label="Filter comment type"
          />
          <Select
            value={selectedNovel}
            onChange={setSelectedNovel}
            options={[
              { value: 'all', label: 'All Novels' },
              ...novels.map((novel) => ({
                value: novel.id,
                label: novel.title
              }))
            ]}
            className="w-full sm:w-64"
            aria-label="Filter comments by novel"
          />
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icon icon="mdi:comment-off-outline" className="text-4xl mx-auto mb-2" />
          <p>No comments found</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-card">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-primary">
                  {comment.user.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-foreground font-semibold">
                      {comment.user.username[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{comment.user.username}</p>
                      <Link 
                        href={comment.chapter.title === 'Novel Comment' 
                          ? `/novels/${comment.chapter.novel.slug}`
                          : `/novels/${comment.chapter.novel.slug}/c${comment.chapter_number}${
                              comment.part_number ? `-p${comment.part_number}` : ''
                            }${comment.paragraph_id 
                                ? `#${comment.paragraph_id}` 
                                : `#chapter-comments`
                              }`
                        }
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        on {comment.chapter.title} ({comment.chapter.novel.title})
                      </Link>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="mt-2">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 