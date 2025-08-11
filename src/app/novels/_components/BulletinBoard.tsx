'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useIsPWA } from '@/hooks/useIsPWA';

export const PWABulletin = () => {
  const router = useRouter();
  const isPWA = useIsPWA();

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
              Try the Lanry app!
            </h3>
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

const BulletinBoard = () => {
  const router = useRouter();

  return (
    <div className="my-2 flex gap-2">
      {/* Supporters Container */}
      <div 
        className="flex-1 p-4 rounded-lg border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
        style={{
          backgroundImage: 'url(https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section//supporters.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={() => router.push('/supporters')}
      >
        <div className="absolute inset-0 bg-black/40" />
        <Icon 
          icon="ph:confetti-bold" 
          className="text-white text-3xl mb-2 relative z-10" 
        />
        <p className="text-white font-medium relative z-10">Top Supporters</p>
      </div>

      {/* Forum Link Container */}
      <div 
        className="flex-1 p-4 rounded-lg border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
        style={{
          backgroundImage: 'url(https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section//forum.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={() => router.push('/forum')}
      >
        <div className="absolute inset-0 bg-black/40" />
        <Icon 
          icon="fluent:chat-multiple-24-filled" 
          className="text-white text-3xl mb-2 relative z-10" 
        />
        <p className="text-white font-medium relative z-10">Visit Forum</p>
      </div>
    </div>
  );
};

export default BulletinBoard; 