'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';

export const RewardsCard = () => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="bg-container border-0 rounded-lg p-4 h-full">
      <h2 className="text-sm font-medium text-muted-foreground mb-1">Rewards</h2>
      <button
        className="w-full flex items-center justify-between p-3 bg-[#faf7f2] dark:bg-zinc-800 hover:bg-[#faf7f2] dark:hover:bg-zinc-700 transition-colors rounded-lg"
        onClick={() => {
          setClicked(true);
          setTimeout(() => setClicked(false), 2000);
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/10 rounded-lg">
            <Icon icon="ph:gift-fill" className="text-amber-500 text-2xl" />
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-foreground text-sm">{clicked ? 'Coming Soon' : 'Daily Rewards'}</p>
          </div>
        </div>
        <Icon icon="ph:caret-right" className="text-lg text-muted-foreground" />
      </button>
    </div>
  );
}; 