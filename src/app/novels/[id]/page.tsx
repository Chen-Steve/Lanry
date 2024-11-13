'use client';

import { Novel, Chapter } from '@/types/database';
import { Icon } from '@iconify/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Link from 'next/link';

async function getNovel(id: string, userId?: string): Promise<Novel | null> {
  try {
    const isNumericId = !isNaN(Number(id));
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        chapters (
          id,
          title,
          created_at,
          chapter_number
        ),
        bookmarks!left (
          id,
          profile_id
        )
      `)
      .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(id) : id)
      .single()
      .throwOnError();

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const novel = {
      ...data,
      coverImageUrl: data.cover_image_url,
      bookmarks: data.bookmarks?.length ?? 0,
      isBookmarked: userId ? data.bookmarks?.some((b: { profile_id: string }) => b.profile_id === userId) ?? false : false,
      chapters: (data.chapters ?? []).sort((a: Chapter, b: Chapter) => 
        a.chapter_number - b.chapter_number
      )
    };

    return novel;
  } catch (error) {
    console.error('Detailed error in getNovel:', error);
    return null;
  }
}

export default function NovelPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBookmarkLoading] = useState(false);

  useEffect(() => {
    const fetchNovelAndAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
        
        const data = await getNovel(id, session?.user?.id);
        if (data) {
          setNovel(data);
          setIsBookmarked(data.isBookmarked);
        }
      } catch (error) {
        console.error('Auth error:', error);
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

      const isNumericId = !isNaN(Number(id));
      const { data: novelData, error: novelError } = await supabase
        .from('novels')
        .select('id')
        .eq(isNumericId ? 'id' : 'slug', isNumericId ? Number(id) : id)
        .single();

      if (novelError || !novelData) {
        console.error('Error getting novel:', novelError);
        throw new Error('Novel not found');
      }

      const actualNovelId = novelData.id;

      if (isBookmarked) {
        // Remove bookmark - Simplified query
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('profile_id', user.id)
          .eq('novel_id', actualNovelId);

        if (error) {
          console.error('Delete bookmark error:', error);
          throw error;
        }
        setIsBookmarked(false);
        setNovel(prev => prev ? { ...prev, bookmarks: Math.max(0, prev.bookmarks - 1) } : null);
      } else {
        // Add bookmark - Simplified query
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            profile_id: user.id,
            novel_id: actualNovelId,
          });

        if (error) {
          console.error('Insert bookmark error:', error);
          throw error;
        }
        setIsBookmarked(true);
        setNovel(prev => prev ? { ...prev, bookmarks: prev.bookmarks + 1 } : null);
      }
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

  // Rest of your JSX remains the same, just update the bookmark button:
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Cover Image */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-8">
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
              {novel.coverImageUrl ? (
                <Image
                  src={`/novel-covers/${novel.coverImageUrl}`}
                  alt={novel.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            {/* Added buttons below image */}
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
                  href={`/novels/${novel.slug}/chapters/c${novel.chapters[novel.chapters.length - 1].chapter_number}`}
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
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
              <p className="text-lg text-gray-600">by {novel.author}</p>
            </div>
          </div>
          
          {/* Synopsis with Stats */}
          <div className="prose max-w-none mb-8">
            <div className="flex items-center gap-6 mb-2">
              <h2 className="text-xl font-semibold m-0">Synopsis</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:book-open-page-variant" className="text-lg" />
                  <span>{novel.chapters.length} Chapters</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:bookmark" className="text-lg" />
                  <span>{novel.bookmarks} Bookmarks</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-line">{novel.description}</p>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{novel.status}</span>
            </div>
            <div>
              <span className="text-gray-600">Released:</span>
              <span className="ml-2 font-medium">
                {formatDate(novel.created_at)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>
              <span className="ml-2 font-medium">
                {formatDate(novel.updated_at)}
              </span>
            </div>
          </div>

          {/* All Chapters */}
          <div className="mt-12 relative">
            {/* Quick Jump Navigation */}
            <div className="fixed right-4 top-1/2 transform -translate-y-1/2 space-y-2">
              {Array.from({ length: Math.ceil(novel.chapters.length / 150) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(`chapter-section-${index}`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                  title={`Chapters ${index * 150 + 1}-${Math.min((index + 1) * 150, novel.chapters.length)}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Chapter Sections */}
            {Array.from({ length: Math.ceil(novel.chapters.length / 150) }).map((_, sectionIndex) => {
              const sectionChapters = novel.chapters
                .sort((a, b) => a.chapter_number - b.chapter_number)
                .slice(sectionIndex * 150, (sectionIndex + 1) * 150);

              return (
                <div key={sectionIndex} id={`chapter-section-${sectionIndex}`} className="mb-16">
                  <h2 className="text-xl font-semibold mb-4">
                    Chapters {sectionIndex * 150 + 1}-{Math.min((sectionIndex + 1) * 150, novel.chapters.length)}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const chaptersPerColumn = Math.ceil(sectionChapters.length / 3);
                      
                      return Array.from({ length: 3 }).map((_, columnIndex) => (
                        <div key={columnIndex} className="space-y-2">
                          {sectionChapters
                            .slice(
                              columnIndex * chaptersPerColumn,
                              (columnIndex + 1) * chaptersPerColumn
                            )
                            .map((chapter) => (
                              <Link
                                key={chapter.id}
                                href={`/novels/${novel.slug}/chapters/c${chapter.chapter_number}`}
                                className="block p-3 rounded-lg hover:bg-gray-50 text-black border border-gray-200"
                              >
                                <span className="font-medium">
                                  Chapter {chapter.chapter_number}
                                  {chapter.title && `: ${chapter.title}`}
                                </span>
                              </Link>
                            ))}
                        </div>
                      ));
                    })()}
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