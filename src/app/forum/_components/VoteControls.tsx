'use client';

import { Icon } from '@iconify/react';

interface VoteControlsProps {
  score: number;
  isLiked?: boolean;
  onUpvote: () => void;
}

export default function VoteControls({ score = 0, isLiked = false, onUpvote }: VoteControlsProps) {
  return (
    <div className="flex flex-col items-center mr-4">
      <button 
        onClick={onUpvote}
        aria-label={isLiked ? "Unlike" : "Like"}
        className={`${isLiked ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400'} transition-colors p-1`}
      >
        <Icon icon={isLiked ? "mdi:heart" : "mdi:heart-outline"} className="w-6 h-6" />
      </button>
      <span className="text-sm font-medium text-foreground tabular-nums">{score}</span>
    </div>
  );
} 