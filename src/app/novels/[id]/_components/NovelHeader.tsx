import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { NovelCategory } from '@/types/database';
import { TranslatorLinks } from './TranslatorLinks';
import { useState } from 'react';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';

interface NovelHeaderProps {
  title: string;
  author: string;
  translator?: { 
    username: string | null;
    profile_id: string;
  } | null;
  chaptersCount: number;
  bookmarkCount: number;
  viewCount: number;
  coverImageUrl?: string;
  novelAuthorId: string;
  isAuthorNameCustom?: boolean;
  categories?: NovelCategory[];
  // New props for actions and rating
  showActionButtons?: boolean;
  firstChapterNumber?: number;
  novelSlug: string;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
  rating?: number;
  ratingCount?: number;
  userRating?: number;
  novelId: string;
}

const StatsItem = ({ icon, value, color = 'gray' }: { icon: string; value: string; color?: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon 
      icon={icon} 
      className={`text-lg ${color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-gray-600'}`} 
    />
    <span className="text-gray-700">{value}</span>
  </div>
);

const ReadButton = ({ firstChapterNumber, novelSlug }: { firstChapterNumber?: number; novelSlug: string }) => {
  if (firstChapterNumber === undefined) return null;
  
  return (
    <Link 
      href={`/novels/${novelSlug}/c${firstChapterNumber}`}
      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white font-medium"
    >
      <Icon icon="pepicons-print:book" className="text-lg" />
      <span>Start Reading</span>
    </Link>
  );
};

const BookmarkButton = ({
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
}: {
  isAuthenticated: boolean;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onBookmarkClick: () => void;
}) => (
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
    className={`flex items-center text-black justify-center gap-1.5 px-4 py-2 rounded-lg transition-colors touch-manipulation ${
      !isAuthenticated 
        ? 'bg-gray-100 hover:bg-gray-200'
        : isBookmarked 
          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
          : 'bg-gray-100 hover:bg-gray-200'
    } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon 
      icon={isBookmarked ? "pepicons-print:bookmark-filled" : "pepicons-print:bookmark"} 
      className={`text-lg ${isBookmarkLoading ? 'animate-pulse' : ''}`}
    />
    <span className="font-medium text-black">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
  </button>
);

export const NovelHeader = ({
  title,
  author,
  translator,
  chaptersCount,
  bookmarkCount,
  viewCount,
  coverImageUrl,
  novelAuthorId,
  isAuthorNameCustom = true,
  categories,
  showActionButtons,
  firstChapterNumber,
  novelSlug,
  isAuthenticated,
  isBookmarked,
  isBookmarkLoading,
  onBookmarkClick,
  rating = 0,
  ratingCount = 0,
  userRating,
  novelId,
}: NovelHeaderProps) => {
  const [isRating, setIsRating] = useState(false);
  const [localRating, setLocalRating] = useState(rating);
  const [localRatingCount, setLocalRatingCount] = useState(ratingCount);
  const [localUserRating, setLocalUserRating] = useState(userRating);

  const handleRate = async (newRating: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to rate', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    if (isRating) return;

    setIsRating(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Authentication error');
      }

      // First, check if user has already rated
      const { data: existingRating } = await supabase
        .from('novel_ratings')
        .select('id')
        .eq('novel_id', novelId)
        .eq('profile_id', user.id)
        .single();

      const { error } = await supabase
        .from('novel_ratings')
        .upsert({
          id: existingRating?.id || crypto.randomUUID(),
          novel_id: novelId,
          profile_id: user.id,
          rating: newRating,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id,novel_id'
        });

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

      setLocalUserRating(newRating);
      toast.success('Rating updated!', {
        duration: 2000,
        position: 'bottom-center',
      });

    } catch (error) {
      console.error('Error rating novel:', error);
      toast.error('Failed to update rating', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-4">
      {/* Left side with cover and main content */}
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Cover Image */}
        <div className="w-48 sm:w-36 md:w-44 mx-auto sm:mx-0 flex-shrink-0">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
            {coverImageUrl ? (
              <Image
                src={coverImageUrl.startsWith('http') ? coverImageUrl : `/novel-covers/${coverImageUrl}`}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 640px) 192px, (max-width: 768px) 144px, 176px"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
        </div>

        {/* Title and Quick Stats */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900">{title}</h1>
          <div className="text-sm text-gray-600 mb-3">
            {isAuthorNameCustom ? (
              <>
                by {author}
                {translator && (
                  <> • TL: {translator.username ? (
                    <Link 
                      href={`/user-dashboard?id=${translator.profile_id}`}
                      className="text-gray-700 hover:text-gray-900 hover:underline"
                    >
                      {translator.username}
                    </Link>
                  ) : (
                    <span className="text-gray-700">Anonymous</span>
                  )}</>
                )}
              </>
            ) : (
              <>Author: <Link 
                href={`/user-dashboard?id=${novelAuthorId}`}
                className="text-gray-700 hover:text-gray-900 hover:underline"
              >
                {author}
              </Link></>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm mb-4">
            <StatsItem icon="pepicons-print:book" value={`${chaptersCount} Chapters`} color="blue" />
            <StatsItem icon="pepicons-print:bookmark" value={`${bookmarkCount} Bookmarks`} />
            <StatsItem icon="pepicons-print:eye" value={`${viewCount} Views`} color="purple" />
          </div>

          {/* Action Buttons */}
          {showActionButtons && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <ReadButton
                firstChapterNumber={firstChapterNumber}
                novelSlug={novelSlug}
              />
              <BookmarkButton
                isAuthenticated={isAuthenticated}
                isBookmarked={isBookmarked}
                isBookmarkLoading={isBookmarkLoading}
                onBookmarkClick={onBookmarkClick}
              />
            </div>
          )}

          {/* Rating Section */}
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  aria-label={`Rate ${star} stars`}
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={isRating}
                  className={`p-1 transition-colors ${isRating ? 'opacity-50' : 'hover:text-amber-400'}`}
                >
                  <Icon 
                    icon={
                      localUserRating && star <= localUserRating
                        ? "pepicons-print:star-filled"
                        : "pepicons-print:star"
                    }
                    className={`text-2xl sm:text-3xl ${
                      localUserRating && star <= localUserRating
                        ? 'text-amber-400'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center text-sm sm:text-base text-gray-600 ml-1">
              <span>{localRating.toFixed(1)}</span>
              <span className="mx-1">•</span>
              <span>{localRatingCount} {localRatingCount === 1 ? 'rating' : 'ratings'}</span>
              {!isAuthenticated && (
                <span className="text-xs sm:text-sm text-gray-500 ml-2">(Sign in to rate)</span>
              )}
            </div>
          </div>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/novels?category=${category.name.toLowerCase()}`}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Translator Links Box */}
      {translator && <TranslatorLinks translator={translator} />}
    </div>
  );
}; 