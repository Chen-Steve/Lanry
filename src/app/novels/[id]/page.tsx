'use client';

import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { getNovel, toggleBookmark } from '@/services/novelService';
import { NovelContent } from '@/app/novels/[id]/_components/NovelContent';
import AdultContentWarning from './_components/AdultContentWarning';
import { event as gaEvent } from '@/lib/gtag';

export default function NovelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
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
        
        const data = await getNovel(id, session?.user?.id, false);
        if (data) {
          setNovel(data);
          setIsBookmarked(data.isBookmarked || false);
          
          // Track view in Google Analytics
          gaEvent({
            action: 'view_novel',
            category: 'Content',
            label: data.title,
            value: 1
          });
          
          // Increment the view counter (logs are handled server-side)
          try {
            await fetch(`/api/novels/${data.id}/views`, { method: 'POST' });
          } catch (err) {
            console.error('Failed to increment novel views:', err);
          }
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
      toast.error('Create an account to bookmark', {
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
      <NovelContent 
        title={novel.title}
        description={novel.description}
        chaptersCount={novel.chapters.length}
        bookmarkCount={novel.bookmarkCount}
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
        coverImageUrl={novel.coverImageUrl}
        chapters={novel.chapters}
        novelId={novel.id}
        novelAuthorId={novel.author_profile_id}
        rating={novel.rating}
        ratingCount={novel.ratingCount}
        userRating={novel.userRating}
        categories={novel.categories}
        tags={novel.tags}
        characters={novel.characters}
      />
    </div>
  );
} 