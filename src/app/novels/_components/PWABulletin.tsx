'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useIsPWA } from '@/hooks/useIsPWA';
import Image from 'next/image';

const PWABulletin = () => {
  const router = useRouter();
  const isPWA = useIsPWA();

  // Don't show the bulletin if user is already using PWA
  if (isPWA) {
    return null;
  }

  return (
    <div className="my-2">
      <div 
        className="w-full p-4 rounded-lg border border-border shadow-sm flex items-center justify-between relative overflow-hidden cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 transition-all duration-300"
        onClick={() => router.push('/install-app')}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 relative">
            <Image 
              src="/lanry.jpg" 
              alt="Lanry"
              fill
              className="object-cover rounded-full"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Try our new app!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Install Lanry as an app for a better reading experience
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon 
            icon="heroicons:arrow-right" 
            className="text-gray-400 dark:text-gray-500 text-lg" 
          />
        </div>
      </div>
    </div>
  );
};

export default PWABulletin; 