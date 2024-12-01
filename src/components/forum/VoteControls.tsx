'use client';

import { Icon } from '@iconify/react';

interface VoteControlsProps {
  score: number;
  onUpvote: () => void;
  onDownvote: () => void;
}

export default function VoteControls({ score = 0, onUpvote, onDownvote }: VoteControlsProps) {
  return (
    <div className="flex flex-col items-center mr-4">
      <button 
        onClick={onUpvote}
        aria-label="Upvote" 
        className="text-green-600 p-1"
      >
        <Icon icon="pepicons-print:arrow-up" className="w-8 h-8" />
      </button>
      <span className="text-sm font-medium my-1 text-gray-700">{score}</span>
      <button 
        onClick={onDownvote}
        aria-label="Downvote" 
        className="text-red-500 p-1"
      >
        <Icon icon="pepicons-print:arrow-down" className="w-8 h-8" />
      </button>
    </div>
  );
} 