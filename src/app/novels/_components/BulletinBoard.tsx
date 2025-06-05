'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

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