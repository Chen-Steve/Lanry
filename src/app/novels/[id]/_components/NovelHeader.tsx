import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { NovelCategory, Tag } from '@/types/database';
import { TranslatorLinks } from './TranslatorLinks';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { NovelActionButtons } from './NovelActionButtons';
import { generateUUID } from '@/lib/utils';

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
  tags?: Tag[];
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
  ageRating?: 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';
}

const StatsItem = ({ icon, value, color = 'gray', withGap = false }: { icon: string; value: string; color?: string; withGap?: boolean }) => (
  <div className={`flex items-center ${withGap ? 'gap-1' : ''}`}>
    <Icon 
      icon={icon} 
      className={`text-lg ${
        color === 'blue' 
          ? 'text-blue-600 dark:text-blue-400' 
          : color === 'purple' 
            ? 'text-purple-600 dark:text-purple-400' 
            : 'text-gray-600 dark:text-gray-400'
      }`} 
    />
    <span className="text-gray-700 dark:text-gray-200">{value}</span>
  </div>
);

const RatingPopup = ({ 
  onRate, 
  currentRating,
  isRating,
}: { 
  onRate: (rating: number) => void;
  currentRating?: number;
  isRating: boolean;
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const ratingContainerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ratingContainerRef.current) return;
    
    const rect = ratingContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starWidth = rect.width / 5;
    const rating = Math.ceil(x / starWidth);
    // console.log('Mouse move - calculated rating:', rating);
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    // console.log('Mouse leave - resetting hover');
    setHoveredRating(0);
  };

  const handleClick = () => {
    // console.log('Click - current hover rating:', hoveredRating);
    if (!isRating && hoveredRating > 0) {
      // console.log('Submitting rating:', hoveredRating);
      onRate(hoveredRating);
    }
  };

  const renderStars = () => {
    const displayRating = hoveredRating || currentRating || 0;
    // console.log('Rendering stars with rating:', displayRating);
    
    return [...Array(5)].map((_, index) => (
      <Icon
        key={index}
        icon={index < displayRating ? "pepicons-print:star-filled" : "pepicons-print:star"}
        className={`text-2xl ${index < displayRating ? 'text-amber-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="absolute top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 z-50 rating-popup-container">
      <div 
        ref={ratingContainerRef}
        className="flex cursor-pointer gap-1"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ minWidth: '130px' }}
      >
        {renderStars()}
      </div>
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
        {hoveredRating || currentRating || 0} stars
      </div>
    </div>
  );
};

const ageRatingIcons = {
  EVERYONE: 'mdi:account-multiple',
  TEEN: 'mdi:account-school',
  MATURE: 'mdi:account-alert',
  ADULT: 'mdi:account-lock'
} as const;

const ageRatingColors = {
  EVERYONE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  TEEN: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  MATURE: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  ADULT: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
} as const;

export const NovelHeader = ({
  title,
  author,
  translator,
  chaptersCount,
  bookmarkCount,
  // viewCount,
  coverImageUrl,
  novelAuthorId,
  isAuthorNameCustom = true,
  tags,
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
  ageRating = 'EVERYONE',
}: NovelHeaderProps) => {
  const [isRating, setIsRating] = useState(false);
  const [localRating, setLocalRating] = useState(rating);
  const [localRatingCount, setLocalRatingCount] = useState(ratingCount);
  const [localUserRating, setLocalUserRating] = useState(userRating);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      // console.log('User data:', user, 'Error:', userError);
      
      if (userError || !user) {
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

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3 -mt-4 sm:-mt-6 lg:-mt-8">
        {/* Left side with cover and main content */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Cover and Title Section */}
          <div>
            {/* Cover and Title Row */}
            <div className="flex flex-row gap-4 mb-2">
              {/* Cover Image and Tags for Mobile */}
              <div className="flex flex-col gap-2 w-28 sm:w-32 md:w-40 lg:w-48 mx-0 flex-shrink-0">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
                  {coverImageUrl ? (
                    <>
                      <Image
                        src={coverImageUrl.startsWith('http') ? coverImageUrl : `/novel-covers/${coverImageUrl}`}
                        alt={title}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 640px) 192px, (max-width: 768px) 144px, 176px"
                      />
                      <div className="absolute top-2 left-2">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-md ${ageRatingColors[ageRating]}`}>
                          <Icon icon={ageRatingIcons[ageRating]} className="w-3.5 h-3.5" />
                          {ageRating}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                {/* Tags for Mobile */}
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 md:hidden">
                    {tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/search?tags=${tag.id}`}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Title, Author, Stats Section */}
              <div className="flex-1 flex flex-col">
                <div>
                  <h1 className="text-base sm:text-xl md:text-3xl lg:text-4xl font-bold mb-1 text-gray-900 dark:text-gray-50 text-left">{title}</h1>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-2 text-left">
                    {isAuthorNameCustom ? (
                      <>
                        by <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{author}</span>
                        {translator && (
                          <> • TL: {translator.username ? (
                            <Link 
                              href={`/user-dashboard?id=${translator.profile_id}`}
                              className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:underline"
                            >
                              {translator.username}
                            </Link>
                          ) : (
                            <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200">Anonymous</span>
                          )}</>
                        )}
                      </>
                    ) : (
                      <>Author: <Link 
                        href={`/user-dashboard?id=${novelAuthorId}`}
                        className="bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:underline"
                      >
                        {author}
                      </Link></>
                    )}
                  </div>
                </div>

                {/* Stats and Rating */}
                <div className="flex flex-col gap-2">
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-2 text-sm md:text-base lg:text-lg">
                    <StatsItem icon="pepicons-print:book" value={`${chaptersCount}`} color="blue" withGap />
                    <StatsItem icon="pepicons-print:bookmark" value={`${bookmarkCount}`} />
                    <div className="relative">
                      <button
                        ref={ratingButtonRef}
                        className="flex items-center gap-1 transition-colors hover:text-amber-400"
                        onClick={() => setShowRatingPopup(!showRatingPopup)}
                        aria-label="Rate novel"
                      >
                        <Icon 
                          icon="pepicons-print:star-filled"
                          className="text-lg text-amber-400"
                        />
                        <span className="text-gray-700 dark:text-gray-200">{localRating.toFixed(1)}</span>
                        <span className="text-gray-500 dark:text-gray-400">({localRatingCount})</span>
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

                  {/* Translator Links */}
                  {translator && <TranslatorLinks translator={translator} />}
                </div>

                {/* Tags for Desktop */}
                <div className="mt-auto hidden md:block">
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/search?tags=${tag.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full transition-colors bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {showActionButtons && (
        <NovelActionButtons
          firstChapterNumber={firstChapterNumber}
          novelSlug={novelSlug}
          isAuthenticated={isAuthenticated}
          isBookmarked={isBookmarked}
          isBookmarkLoading={isBookmarkLoading}
          onBookmarkClick={onBookmarkClick}
        />
      )}
    </>
  );
}; 