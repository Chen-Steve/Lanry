'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';
import { getTextStyles, formatText } from '@/lib/textFormatting';
import { filterExplicitContent } from '@/lib/contentFiltering';
import { TranslatorLinks } from '@/app/novels/[id]/_components/TranslatorLinks';

interface AuthorProfile {
  username: string;
  avatar_url?: string;
  role: 'AUTHOR' | 'TRANSLATOR' | 'USER';
  kofiUrl?: string;
  patreonUrl?: string;
  customUrl?: string;
  customUrlLabel?: string;
  author_bio?: string;
}

interface AuthorWordsProps {
  authorThoughts: string;
  authorProfile?: AuthorProfile;
  authorId: string;
  fontFamily: string;
  fontSize: number;
  showProfanity?: boolean;
  novelId: string;
  chapterNumber: number;
}

export default function AuthorWords({
  authorThoughts,
  authorProfile,
  authorId,
  fontFamily,
  fontSize,
  showProfanity = false,
  novelId,
  chapterNumber
}: AuthorWordsProps) {
  const hasThoughts = typeof authorThoughts === 'string' && authorThoughts.trim() !== '';
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('id, like_count')
          .eq('chapter_number', chapterNumber)
          .eq('novel_id', novelId)
          .single();

        if (chapterError) throw chapterError;
        setLikeCount(chapter.like_count || 0);

        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          const { data, error: likeError } = await supabase
            .from('chapter_likes')
            .select('id')
            .eq('chapter_id', chapter.id)
            .eq('profile_id', session.session.user.id);

          if (likeError) throw likeError;
          setIsLiked(!!(data && data.length > 0));
        }
      } catch {
        // Fail silently; do not disrupt content rendering
        // console.error('Error fetching likes:', err);
      }
    };

    fetchLikes();
  }, [chapterNumber, novelId]);

  const handleLikeClick = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      toast.error('Must be logged in to like chapters');
      return;
    }

    if (isLikeLoading) return;
    setIsLikeLoading(true);

    try {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('chapter_number', chapterNumber)
        .eq('novel_id', novelId)
        .single();

      if (chapterError) throw chapterError;

      if (isLiked) {
        const { error: deleteLikeError } = await supabase
          .from('chapter_likes')
          .delete()
          .eq('chapter_id', chapter.id)
          .eq('profile_id', session.session.user.id);

        if (deleteLikeError) throw deleteLikeError;

        const { data: currentChapter, error: getCurrentError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (getCurrentError) throw getCurrentError;
        const currentCount = currentChapter?.like_count || 0;
        const newCount = Math.max(0, currentCount - 1);

        const { error: updateError } = await supabase
          .from('chapters')
          .update({ like_count: newCount })
          .eq('id', chapter.id);

        if (updateError) throw updateError;

        setLikeCount(newCount);
        setIsLiked(false);
      } else {
        const now = new Date().toISOString();
        const { error: createLikeError } = await supabase
          .from('chapter_likes')
          .insert({
            id: crypto.randomUUID(),
            profile_id: session.session.user.id,
            chapter_id: chapter.id,
            novel_id: novelId,
            created_at: now,
            updated_at: now
          });

        if (createLikeError) throw createLikeError;

        const { data: currentChapter, error: getCurrentError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (getCurrentError) throw getCurrentError;
        const currentCount = currentChapter?.like_count || 0;
        const newCount = currentCount + 1;

        const { error: updateError } = await supabase
          .from('chapters')
          .update({ like_count: newCount })
          .eq('id', chapter.id);

        if (updateError) throw updateError;

        setLikeCount(newCount);
        setIsLiked(true);
      }
    } catch {
      // console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border border-border shadow-sm p-2 md:p-3">
        <div className="not-prose flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {authorProfile && (
              <div className="flex-shrink-0 h-10 flex items-center">
                {authorProfile.avatar_url ? (
                  <img
                    src={authorProfile.avatar_url}
                    alt={authorProfile.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = authorProfile.username[0]?.toUpperCase() || '?';
                        parent.className =
                          'w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg';
                      }
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                    {authorProfile.username[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="m-0 text-base md:text-lg leading-none font-medium text-foreground truncate">
                {`${authorProfile?.username || 'Author'}'s words`}
              </h3>
            </div>
          </div>

          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors ${
              isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'
            }`}
            title={isLiked ? 'Unlike chapter' : 'Like chapter'}
          >
            <Icon icon={isLiked ? 'mdi:heart' : 'mdi:heart-outline'} className="w-5 h-5" />
            <span className="font-medium text-sm">{likeCount}</span>
          </button>
        </div>

        {hasThoughts && (
          <div
            className="prose prose-sm md:prose-base text-foreground dark:prose-invert mt-2 md:mt-3"
            style={getTextStyles(fontFamily, fontSize - 1)}
            dangerouslySetInnerHTML={{
              __html: formatText(filterExplicitContent(authorThoughts, !showProfanity))
            }}
          />
        )}

        {authorProfile && (
          <div className="mt-3 md:mt-4 pt-3 border-t border-border">
            <TranslatorLinks
              translator={{
                username: authorProfile.username,
                profile_id: authorId,
                kofiUrl: authorProfile.kofiUrl,
                patreonUrl: authorProfile.patreonUrl,
                customUrl: authorProfile.customUrl,
                customUrlLabel: authorProfile.customUrlLabel,
                author_bio: authorProfile.author_bio
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}


