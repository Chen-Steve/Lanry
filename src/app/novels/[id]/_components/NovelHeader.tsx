'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { NovelCategory, Tag } from '@/types/database';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import { NovelSynopsis } from './NovelSynopsis';
import { RatingPopup } from './RatingPopup';
import { TagsModal } from './TagsModal';
import { StatsItem } from './StatsItem';
import { NovelAgeRating } from './NovelAgeRating';
import supabase from '@/lib/supabaseClient';
import { useSupabase } from '@/app/providers';

interface NovelHeaderProps {
  title: string;
  author: string;
  translator?: { 
    username: string | null;
    profile_id: string;
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
    author_bio?: string;
  } | null;
  bookmarkCount: number;
  chapterCount?: number;
  coverImageUrl?: string;
  novelAuthorId: string;
  isAuthorNameCustom?: boolean;
  categories?: NovelCategory[];
  tags?: Tag[];
  description: string;
  firstChapterNumber?: number;
  firstChapterPartNumber?: number | null;
  novelSlug: string;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
  rating?: number;
  ratingCount?: number;
  userRating?: number;
  novelId: string;
  ageRating?: 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';
  characters?: {
    id: string;
    name: string;
    role: string;
    imageUrl: string;
    description?: string | null;
    orderIndex: number;
  }[];
  hideDescription?: boolean;
}

export const NovelHeader = ({
  title,
  author,
  translator,
  bookmarkCount,
  coverImageUrl,
  novelAuthorId,
  isAuthorNameCustom = true,
  tags,
  description,
  firstChapterNumber,
  firstChapterPartNumber,
  novelSlug,
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
  rating = 0,
  ratingCount = 0,
  userRating,
  novelId,
  ageRating = 'EVERYONE',
  characters = [],
  hideDescription = false,
}: NovelHeaderProps) => {
  const [isRating, setIsRating] = useState(false);
  const [localRating, setLocalRating] = useState(rating);
  const [localRatingCount, setLocalRatingCount] = useState(ratingCount);
  const [localUserRating, setLocalUserRating] = useState(userRating);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);
  const { user } = useSupabase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (ratingButtonRef.current && 
          !ratingButtonRef.current.contains(target) && 
          !target.closest('.rating-popup-container')) {
        setShowRatingPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRate = async (newRating: number) => {
    // console.log('handleRate called with rating:', newRating);
    
    if (!isAuthenticated) {
      // console.log('User not authenticated');
      toast.error('Please sign in to rate', {
        duration: 3000,
        position: 'bottom-center',
      });
      setShowRatingPopup(false);
      return;
    }

    if (isRating) {
      // console.log('Rating in progress, returning');
      return;
    }

    setIsRating(true);
    try {
      if (!user) {
        throw new Error('Authentication error');
      }

      // Update local state optimistically
      setLocalUserRating(newRating);
      
      // First, check if user has already rated
      const { data: existingRating } = await supabase
        .from('novel_ratings')
        .select('id')
        .eq('novel_id', novelId)
        .eq('profile_id', user.id)
        .single();

      // console.log('Existing rating:', existingRating);

      const { error } = await supabase
        .from('novel_ratings')
        .upsert({
          id: existingRating?.id || generateUUID(),
          novel_id: novelId,
          profile_id: user.id,
          rating: newRating,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id,novel_id'
        });

      // console.log('Upsert error:', error);

      if (error) throw error;

      // Get updated novel statistics
      const { data: novelData, error: novelError } = await supabase
        .from('novels')
        .select('rating, rating_count')
        .eq('id', novelId)
        .single();

      if (novelError) throw novelError;

      if (novelData) {
        setLocalRating(novelData.rating);
        setLocalRatingCount(novelData.rating_count);
      }

      toast.success(
        <div className="flex items-center gap-2">
          <Icon icon="pepicons-print:star-filled" className="text-amber-400 text-lg" />
          <span>Rated {newRating.toFixed(1)} stars!</span>
        </div>,
        {
          duration: 2000,
          position: 'bottom-center',
          style: {
            background: '#fff',
            color: '#374151',
            padding: '12px',
          },
        }
      );

    } catch (error) {
      // Revert optimistic update on error
      setLocalUserRating(userRating);
      console.error('Error rating novel:', error);
      toast.error('Failed to update rating', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsRating(false);
      setShowRatingPopup(false);
    }
  };

  const imageUrl = coverImageUrl?.startsWith('http') 
    ? coverImageUrl
    : coverImageUrl ? `/novel-covers/${coverImageUrl}` : null;

  return (
    <>
      {/* Novel Header Content */}
      <div className="-mt-2 sm:-mt-3">
        <div className="flex flex-col gap-4">
          {/* Top Row - Cover and Info */}
          <div className="flex gap-4">
            {/* Left Side - Cover Image */}
            <div className="w-28 sm:w-36 lg:w-44 flex-shrink-0">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md">
                {imageUrl ? (
                  <>
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 176px"
                      className="object-cover"
                      priority={true}
                      quality={85}
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <NovelAgeRating rating={ageRating} />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-4 break-words">
                        {title}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="flex-1 min-w-0 flex flex-col min-h-[168px] sm:min-h-[216px] lg:min-h-[264px]">
              {/* Title, Author Info, and Desktop Stats/Tags Container */}
              <div className="flex-1">
                {/* Title and Author Info */}
                <div>
                  <div className="sm:block overflow-x-auto scrollbar-hide">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-50 leading-tight whitespace-nowrap pr-4 sm:pr-0 sm:whitespace-normal">
                      {title}
                    </h1>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 text-sm mt-2">
                    {isAuthorNameCustom ? (
                      <>
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">by</span>
                        <span className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 sm:py-1 rounded-md text-gray-800 dark:text-gray-200 font-medium text-xs sm:text-sm">
                          {author}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Author:</span>
                        <Link 
                          href={`/user-dashboard?id=${novelAuthorId}`}
                          className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 sm:py-1 rounded-md text-gray-800 dark:text-gray-200 font-medium hover:text-gray-900 dark:hover:text-white hover:underline text-xs sm:text-sm"
                        >
                          {author}
                        </Link>
                      </>
                    )}
                    {translator && (
                      <>
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">•</span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">TL:</span>
                        {translator.username ? (
                          <Link 
                            href={`/user-dashboard?id=${translator.profile_id}`}
                            className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 sm:py-1 rounded-md text-gray-800 dark:text-gray-200 font-medium hover:text-gray-900 dark:hover:text-white hover:underline text-xs sm:text-sm"
                          >
                            {translator.username}
                          </Link>
                        ) : (
                          <span className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 sm:py-1 rounded-md text-gray-800 dark:text-gray-200 font-medium text-xs sm:text-sm">
                            Anonymous
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Stats and Tags */}
                <div className="hidden sm:flex flex-col gap-2 mt-2">
                  {/* Desktop Tags */}
                  {tags && tags.length > 0 && (
                    <div className="hidden sm:flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/search?tags=${tags[0].id}`}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {tags[0].name}
                      </Link>
                      {tags.length > 1 && (
                        <button
                          onClick={() => setShowTagsModal(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                          aria-label={`Show all ${tags.length} tags`}
                        >
                          <Icon icon="mdi:dots-horizontal" className="text-sm" />
                          +{tags.length - 1} more
                        </button>
                      )}
                      <TagsModal
                        tags={tags}
                        isOpen={showTagsModal}
                        onClose={() => setShowTagsModal(false)}
                      />
                    </div>
                  )}

                  {/* Desktop Synopsis */}
                  <div className="hidden sm:block">
                    {hideDescription ? null : (
                      <NovelSynopsis
                        description={description}
                        characters={characters}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons and Stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {firstChapterNumber !== undefined && (
                    <Link 
                      href={`/novels/${novelSlug}/c${firstChapterNumber}${firstChapterPartNumber ? `-p${firstChapterPartNumber}` : ''}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors text-white font-medium"
                    >
                      <Icon icon="pepicons-print:book-open" className="text-xl" />
                      <span className="text-sm">Read Now</span>
                    </Link>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isBookmarkLoading) {
                        onBookmarkClick();
                      }
                    }}
                    type="button"
                    disabled={isBookmarkLoading}
                    aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors touch-manipulation ${
                      !isAuthenticated 
                        ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
                        : isBookmarked 
                          ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/50'
                    } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon 
                      icon={isBookmarked ? "pepicons-print:checkmark" : "pepicons-print:bookmark"} 
                      className={`text-[20px] text-gray-700 dark:text-gray-200 flex-shrink-0 ${isBookmarkLoading ? 'animate-pulse' : ''}`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-3 sm:ml-auto">
                  <div className="flex items-center gap-3 px-2 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg text-sm">
                    <StatsItem icon="pepicons-print:bookmark" value={`${bookmarkCount}`} />
                  </div>
                  <div className="relative flex items-center px-2 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <button
                      ref={ratingButtonRef}
                      className="flex items-center gap-1.5 transition-colors hover:text-amber-400"
                      onClick={() => setShowRatingPopup(!showRatingPopup)}
                      aria-label="Rate novel"
                    >
                      <Icon 
                        icon="pepicons-print:star-filled"
                        className="text-lg text-amber-400"
                      />
                      <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">{localRating.toFixed(1)}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">({localRatingCount})</span>
                    </button>
                    {showRatingPopup && (
                      <RatingPopup
                        onRate={handleRate}
                        currentRating={localUserRating}
                        isRating={isRating}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tags */}
      <div className="sm:hidden mt-4 overflow-x-auto scrollbar-hide pb-6">
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?tags=${tag.id}`}
                className="flex-none inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 whitespace-nowrap"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Synopsis Container */}
      <div className="-mt-2 sm:-mt-3 -mb-4">
        <div className="sm:hidden mt-4">
          {hideDescription ? null : (
            <NovelSynopsis
              description={description}
              characters={characters}
            />
          )}
        </div>
      </div>
    </>
  );
}; 