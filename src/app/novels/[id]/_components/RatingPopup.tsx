import { Icon } from '@iconify/react';
import { useState, useRef } from 'react';

interface RatingPopupProps {
  onRate: (rating: number) => void;
  currentRating?: number;
  isRating: boolean;
}

export const RatingPopup = ({ 
  onRate, 
  currentRating,
  isRating,
}: RatingPopupProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const ratingContainerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ratingContainerRef.current) return;
    
    const rect = ratingContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starWidth = rect.width / 5;
    const rating = Math.ceil(x / starWidth);
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const handleClick = () => {
    if (!isRating && hoveredRating > 0) {
      onRate(hoveredRating);
    }
  };

  const renderStars = () => {
    const displayRating = hoveredRating || currentRating || 0;
    
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