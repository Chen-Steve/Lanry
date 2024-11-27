'use client';

import { Novel, UserProfile } from '@/types/database';
import { Icon } from '@iconify/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getNovel, toggleBookmark } from '@/services/novelService';
import { track } from '@vercel/analytics';
import { ChapterList } from '@/components/novels/ChapterList';
import { SynopsisSection } from '@/components/novels/SynopsisSection';

export default function NovelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [viewCount, setViewCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
          console.log('Novel data:', data);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newBookmarkState = await toggleBookmark(id, user.id, isBookmarked);
      setIsBookmarked(newBookmarkState);
      setNovel(prev => prev ? {
        ...prev,
        bookmarkCount: prev.bookmarkCount + (newBookmarkState ? 1 : -1)
      } : null);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
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

  // console.log('Novel author ID:', novel.author_profile_id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover Image */}
        <div className="w-full md:w-80 md:flex-shrink-0">
          <div className="md:sticky md:top-8">
            {/* Cover Image Container */}
            <div className="relative w-1/3 md:w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg float-left md:float-none mr-4 md:mr-0">
              {novel.coverImageUrl ? (
                <Image
                  src={`/novel-covers/${novel.coverImageUrl}`}
                  alt={novel.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 320px"
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>

            {/* Title and Basic Info - Shows next to image on mobile, below on desktop */}
            <div className="md:mt-6">
              <h1 className="text-xl md:text-3xl font-bold mb-1 text-black">{novel.title}</h1>
              <div className="space-y-1 mb-4">
                <p className="text-sm text-gray-600">
                  Author: {novel.author}
                </p>
                {novel.translator && (
                  <p className="text-sm text-gray-600">
                    Translator: {novel.translator.username}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 clear-both">
                <button 
                  onClick={handleBookmark}
                  type="button"
                  disabled={isBookmarkLoading}
                  aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"} 
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors w-full ${
                    !isAuthenticated 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                      : isBookmarked 
                        ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } ${isBookmarkLoading ? 'opacity-50' : ''}`}
                >
                  <Icon 
                    icon={isBookmarked ? "pepicons-print:bookmark-filled" : "pepicons-print:bookmark"} 
                    className={`text-xl ${isBookmarkLoading ? 'animate-pulse' : ''}`}
                  />
                  <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
                
                {novel.chapters.length > 0 && (
                  <Link 
                    href={`/novels/${novel.slug}/chapters/c${novel.chapters[0].chapter_number}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors w-full"
                  >
                    <Icon icon="pepicons-print:book" className="text-xl" />
                    <span>Start Reading</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Novel Information */}
        <div className="flex-grow">
          <SynopsisSection 
            description={novel.description}
            chaptersCount={novel.chapters.length}
            bookmarkCount={novel.bookmarkCount}
            viewCount={viewCount}
            status={novel.status}
            createdAt={novel.created_at}
            updatedAt={novel.updated_at}
          />

          <ChapterList
            chapters={novel.chapters}
            novelId={novel.id}
            novelSlug={novel.slug}
            userProfile={userProfile}
            isAuthenticated={isAuthenticated}
            novelAuthorId={novel.author_profile_id}
          />
        </div>
      </div>
    </div>
  );
} 