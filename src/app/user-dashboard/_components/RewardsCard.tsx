'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';

interface RewardsCardProps {
  onLogout?: () => void;
}

export const RewardsCard = ({ onLogout }: RewardsCardProps) => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="bg-container border-0 rounded-lg p-3 h-full flex flex-col">
      <button
        className="w-full flex items-center justify-between p-2.5 bg-[#faf7f2] dark:bg-zinc-800 hover:bg-[#faf7f2] dark:hover:bg-zinc-700 transition-colors rounded-lg"
        onClick={() => {
          setClicked(true);
          setTimeout(() => setClicked(false), 2000);
        }}
      >
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500/10 rounded-lg p-0.5">
            <Icon icon="ph:gift-fill" className="text-amber-500 text-xl" />
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-foreground text-sm leading-tight">{clicked ? 'Coming Soon' : 'Daily Rewards'}</p>
          </div>
        </div>
        <Icon icon="ph:caret-right" className="text-base text-muted-foreground" />
      </button>

      {onLogout && (
        <div className="mt-auto pt-2">
          <button
            onClick={onLogout}
            className="w-full bg-container border-0 rounded-lg p-4 flex items-center gap-3 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon icon="ph:sign-out" className="text-xl" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}; 