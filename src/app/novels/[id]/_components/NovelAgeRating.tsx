import { Icon } from '@iconify/react';

type AgeRating = 'EVERYONE' | 'TEEN' | 'MATURE' | 'ADULT';

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

interface NovelAgeRatingProps {
  rating: AgeRating;
  className?: string;
}

export const NovelAgeRating = ({ rating, className = '' }: NovelAgeRatingProps) => (
  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium backdrop-blur-md ${ageRatingColors[rating]} ${className}`}>
    <Icon icon={ageRatingIcons[rating]} className="w-3 h-3" />
    {rating}
  </div>
); 