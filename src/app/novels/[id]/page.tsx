'use client';

import { Novel, UserProfile } from '@/types/database';
import { Icon } from '@iconify/react';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { getNovel, toggleBookmark } from '@/services/novelService';
import { track } from '@vercel/analytics';
import { SynopsisSection } from '@/app/novels/[id]/_components/SynopsisSection';
import AdultContentWarning from './_components/AdultContentWarning';

export default function NovelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [viewCount, setViewCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasAcceptedWarning, setHasAcceptedWarning] = useState(false);

  useEffect(() => {
    // Check localStorage for age confirmation
    const hasAccepted = localStorage.getItem('adult-content-accepted') === 'true';
    setHasAcceptedWarning(hasAccepted);
  }, []);

  useEffect(() => {
    const fetchNovelAndAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!profile) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  username: session.user.user_metadata?.full_name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  updated_at: new Date().toISOString(),
                }
              ])
              .select()
              .single();

            if (!insertError) {
              profile = newProfile;
            }
          }
          
          setUserProfile(profile);
        }
        
        const data = await getNovel(id, session?.user?.id);
        if (data) {
          setNovel(data);
          setIsBookmarked(data.isBookmarked || false);
          setViewCount(data.views || 0);
          
          track('novel-view', {
            novelId: id,
            novelTitle: data.title
          });
          
          const { error: rpcError } = await supabase
            .rpc('increment_novel_views', { novel_id: id });

          if (rpcError) {
            console.error('Error updating view count:', rpcError);
            return;
          }

          setViewCount((data.views || 0) + 1);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovelAndAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please create an account to bookmark', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#F87171',
          color: 'white',
          padding: '12px 24px',
        },
        icon: <Icon icon="mdi:bookmark-plus" className="text-xl" />,
      });
      return;
    }

    setIsBookmarkLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Authentication error: ' + userError.message);
      }
      
      if (!user) {
        throw new Error('User not found');
      }

      const newBookmarkState = await toggleBookmark(id, user.id, isBookmarked);
      
      if (newBookmarkState === undefined) {
        throw new Error('Failed to toggle bookmark');
      }
      
      setIsBookmarked(newBookmarkState);
      setNovel(prev => prev ? {
        ...prev,
        bookmarkCount: prev.bookmarkCount + (newBookmarkState ? 1 : -1)
      } : null);
      
      toast.success(newBookmarkState ? 'Novel bookmarked' : 'Bookmark removed', {
        duration: 2000,
        position: 'bottom-center',
      });

    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update bookmark', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!novel) {
    notFound();
  }

  if (novel.ageRating === 'ADULT' && !hasAcceptedWarning) {
    return <AdultContentWarning onAccept={() => setHasAcceptedWarning(true)} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <SynopsisSection 
        title={novel.title}
        description={novel.description}
        chaptersCount={novel.chapters.length}
        bookmarkCount={novel.bookmarkCount}
        viewCount={viewCount}
        status={novel.status}
        ageRating={novel.ageRating}
        createdAt={novel.created_at}
        updatedAt={novel.updated_at}
        author={novel.author}
        isAuthorNameCustom={novel.is_author_name_custom}
        translator={novel.translator}
        novelSlug={novel.slug}
        firstChapterNumber={novel.chapters[0]?.chapter_number}
        isAuthenticated={isAuthenticated}
        isBookmarked={isBookmarked}
        isBookmarkLoading={isBookmarkLoading}
        onBookmarkClick={handleBookmark}
        showActionButtons={true}
        coverImageUrl={novel.coverImageUrl}
        chapters={novel.chapters}
        volumes={novel.volumes}
        novelId={novel.id}
        userProfile={userProfile}
        novelAuthorId={novel.author_profile_id}
        rating={novel.rating}
        ratingCount={novel.ratingCount}
        userRating={novel.userRating}
      />
    </div>
  );
} 