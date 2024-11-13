'use client';

import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getNovel, toggleBookmark } from '@/services/novelService';
import { track } from '@vercel/analytics';

export default function NovelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBookmarkLoading] = useState(false);
  const [viewCount, setViewCount] = useState<number>(0);

  useEffect(() => {
    const fetchNovelAndAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // console.log('Auth state:', !!session?.user);
        setIsAuthenticated(!!session?.user);
        
        const data = await getNovel(id, session?.user?.id);
        if (data) {
          setNovel(data);
          setIsBookmarked(data.isBookmarked);
          setViewCount(data.views || 0);
          
          // Track page view
          track('novel-view', {
            novelId: id,
            novelTitle: data.title
          });
          
          // Update view count using RPC
          const { error: rpcError } = await supabase
            .rpc('increment_novel_views', { 
              novel_id: id 
            });

          if (rpcError) {
            console.error('Error updating view count:', rpcError);
            return;
          }

          // Update local view count after successful RPC call
          setViewCount((data.views || 0) + 1);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovelAndAuth();

    // Set up auth listener
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newBookmarkState = await toggleBookmark(id, user.id, isBookmarked);
      setIsBookmarked(newBookmarkState);
      setNovel(prev => prev ? { 
        ...prev, 
        bookmarks: prev.bookmarks + (newBookmarkState ? 1 : -1)
      } : null);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!novel) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Header Layout */}
        <div className="md:hidden flex gap-4 mb-6">
          <div className="relative w-1/3 aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
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
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1 text-black">{novel.title}</h1>
            <p className="text-sm text-gray-600 mb-2">by {novel.author}</p>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Icon icon="mdi:book-open-page-variant" className="text-lg" />
                <span>{novel.chapters.length} Chapters</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:bookmark" className="text-lg" />
                  <span>{novel.bookmarks} Bookmarks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:eye" className="text-lg" />
                  <span>{viewCount} Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Cover Image */}
        <div className="hidden md:block w-80 flex-shrink-0">
          <div className="sticky top-8">
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
              {novel.coverImageUrl ? (
                <Image
                  src={`/novel-covers/${novel.coverImageUrl}`}
                  alt={novel.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="320px"
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            {/* Bookmark and Start Reading buttons */}
            <div className="flex flex-col gap-2 mt-4">
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
                  icon={isBookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"} 
                  className={`text-xl ${isBookmarkLoading ? 'animate-pulse' : ''}`}
                />
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
              
              {novel.chapters.length > 0 && (
                <Link 
                  href={`/novels/${novel.slug}/chapters/c${novel.chapters[0].chapter_number}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors w-full"
                >
                  <Icon icon="mdi:book-open-page-variant" className="text-xl" />
                  <span>Start Reading</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Novel Information */}
        <div className="flex-grow">
          {/* Desktop Title (hidden on mobile) */}
          <div className="hidden md:flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-black">{novel.title}</h1>
              <p className="text-lg text-gray-600">by {novel.author}</p>
            </div>
          </div>
          
          {/* Mobile Buttons */}
          <div className="md:hidden flex flex-col gap-2 mb-6">
            {/* Move the buttons here for mobile */}
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
                icon={isBookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"} 
                className={`text-xl ${isBookmarkLoading ? 'animate-pulse' : ''}`}
              />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            
            {novel.chapters.length > 0 && (
              <Link 
                href={`/novels/${novel.slug}/chapters/c${novel.chapters[0].chapter_number}`}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors w-full"
              >
                <Icon icon="mdi:book-open-page-variant" className="text-xl" />
                <span>Start Reading</span>
              </Link>
            )}
          </div>

          {/* Synopsis with Stats */}
          <div className="prose max-w-none mb-8">
            <div className="flex items-center gap-6 mb-2">
              <h2 className="text-xl font-semibold m-0 text-black">Synopsis</h2>
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:book-open-page-variant" className="text-lg" />
                  <span>{novel.chapters.length} Chapters</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:bookmark" className="text-lg" />
                  <span>{novel.bookmarks} Bookmarks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:eye" className="text-lg" />
                  <span>{viewCount} Views</span>
                </div>
              </div>
            </div>
            <p className="text-black whitespace-pre-line">{novel.description}</p>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium text-black">{novel.status}</span>
            </div>
            <div>
              <span className="text-gray-600">Released:</span>
              <span className="ml-2 font-medium text-black">{formatDate(novel.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>
              <span className="ml-2 font-medium text-black">{formatDate(novel.updated_at)}</span>
            </div>
          </div>

          {/* All Chapters */}
          <div className="mt-12 relative">
            {/* Quick Jump Navigation */}
            <div className="hidden md:fixed md:right-4 md:top-1/2 md:transform md:-translate-y-1/2 md:space-y-2">
              {Array.from({ length: Math.ceil(novel.chapters.length / 150) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(`chapter-section-${index}`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm text-black"
                  title={`Chapters ${index * 150 + 1}-${Math.min((index + 1) * 150, novel.chapters.length)}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Chapter sections */}
            {Array.from({ length: Math.ceil(novel.chapters.length / 150) }).map((_, sectionIndex) => {
              const sectionChapters = novel.chapters.slice(
                sectionIndex * 150,
                (sectionIndex + 1) * 150
              );

              return (
                <div
                  key={sectionIndex}
                  id={`chapter-section-${sectionIndex}`}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold mb-4 text-black">
                    Chapters {sectionIndex * 150 + 1}-
                    {Math.min((sectionIndex + 1) * 150, novel.chapters.length)}
                  </h3>
                  <div className="grid gap-2">
                    {sectionChapters.map((chapter) => {
                      const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
                      const chapterContent = (
                        <>
                          <span className="inline-block min-w-[3rem]">Ch. {chapter.chapter_number}</span>
                          {chapter.title && <span className="ml-2">{chapter.title}</span>}
                        </>
                      );
                      
                      return (
                        <div
                          key={chapter.id}
                          className={`flex flex-col border-b border-gray-100 py-3 px-4 ${
                            isPublished ? 'hover:bg-gray-50' : 'bg-gray-50/50'
                          } transition-colors rounded-lg gap-2`}
                        >
                          <div className="flex-grow flex flex-col w-full gap-2">
                            {!isPublished && chapter.publish_at ? (
                              <>
                                <div 
                                  className="text-gray-600 cursor-pointer"
                                  onClick={() => toast.success('Buy with coins - Coming Soon!', {
                                    duration: 3000,
                                    position: 'bottom-center',
                                    style: {
                                      background: '#8B5CF6', // Purple color
                                      color: 'white',
                                      padding: '12px 24px',
                                    },
                                    icon: <Icon icon="material-symbols:payments-outline" className="text-xl" />,
                                  })}
                                >
                                  {chapterContent}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 bg-purple-50 text-purple-800 px-2 py-1 rounded-md text-sm">
                                    <Icon icon="material-symbols:lock" className="text-lg" />
                                    <span className="font-medium">Available {formatDate(chapter.publish_at)}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <Link 
                                href={`/novels/${novel.slug}/chapters/c${chapter.chapter_number}`}
                                className="flex-grow flex flex-col sm:flex-row sm:items-center text-gray-600 gap-1 hover:text-gray-900"
                              >
                                <div className="flex items-center gap-2">
                                  {chapterContent}
                                </div>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 