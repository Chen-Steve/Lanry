import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { NovelCategory } from '@/types/database';
import { TranslatorLinks } from './TranslatorLinks';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { NovelActionButtons } from './NovelActionButtons';

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

const StatsItem = ({ icon, value, color = 'gray', withGap = false }: { icon: string; value: string; color?: string; withGap?: boolean }) => (
  <div className={`flex items-center ${withGap ? 'gap-1' : ''}`}>
    <Icon 
      icon={icon} 
      className={`text-lg ${color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-gray-600'}`} 
    />
    <span className="text-gray-700">{value}</span>
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
    console.log('Mouse move - calculated rating:', rating);
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    console.log('Mouse leave - resetting hover');
    setHoveredRating(0);
  };

  const handleClick = () => {
    console.log('Click - current hover rating:', hoveredRating);
    if (!isRating && hoveredRating > 0) {
      console.log('Submitting rating:', hoveredRating);
      onRate(hoveredRating);
    }
  };

  const renderStars = () => {
    const displayRating = hoveredRating || currentRating || 0;
    console.log('Rendering stars with rating:', displayRating);
    
    return [...Array(5)].map((_, index) => (
      <Icon
        key={index}
        icon={index < displayRating ? "pepicons-print:star-filled" : "pepicons-print:star"}
        className={`text-2xl ${index < displayRating ? 'text-amber-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-50 rating-popup-container">
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
      <div className="text-xs text-center text-gray-500 mt-1">
        {hoveredRating || currentRating || 0} stars
      </div>
    </div>
  );
};

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
    console.log('handleRate called with rating:', newRating);
    
    if (!isAuthenticated) {
      console.log('User not authenticated');
      toast.error('Please sign in to rate', {
        duration: 3000,
        position: 'bottom-center',
      });
      setShowRatingPopup(false);
      return;
    }

    if (isRating) {
      console.log('Rating in progress, returning');
      return;
    }

    setIsRating(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User data:', user, 'Error:', userError);
      
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

      console.log('Existing rating:', existingRating);

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

      console.log('Upsert error:', error);

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
      <div className="flex flex-col lg:flex-row gap-4 mb-2">
        {/* Left side with cover and main content */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Cover and Title Section */}
          <div>
            {/* Cover and Title Row */}
            <div className="flex flex-row gap-4 mb-4">
              {/* Cover Image */}
              <div className="w-32 sm:w-36 md:w-44 mx-0 flex-shrink-0">
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
                {/* Translator Links for mobile */}
                {translator && <div className="mt-3 sm:hidden"><TranslatorLinks translator={translator} /></div>}
              </div>

              {/* Title and Author Section */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900 text-left">{title}</h1>
                <div className="text-sm text-gray-600 mb-4 text-left">
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

                {/* Stats and Rating */}
                <div className="flex flex-col gap-4">
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-2 text-sm">
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
                          icon={localUserRating ? "pepicons-print:star-filled" : "pepicons-print:star"}
                          className={`text-lg ${localUserRating ? 'text-amber-400' : 'text-gray-400'}`}
                        />
                        <span className="text-gray-700">{localRating.toFixed(1)}</span>
                        <span className="text-gray-500">({localRatingCount})</span>
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

                  {/* Translator Links for non-mobile */}
                  {translator && <div className="hidden sm:block"><TranslatorLinks translator={translator} /></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
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