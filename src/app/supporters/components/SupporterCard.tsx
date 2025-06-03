'use client';

import React from 'react';
import Link from 'next/link';
import { TopSupporter } from '../actions';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@iconify/react';

export const SupporterCard = ({ supporter, index }: { supporter: TopSupporter; index: number }) => {
  const isTopThree = index < 3;
  const isFirst = index === 0;
  
  // Calculate avatar size based on position
  const avatarSize = isFirst ? 80 : isTopThree ? 64 : 48;
  
  return (
    <article
      className={`
        relative bg-container border-0 rounded-md overflow-hidden flex
        ${isFirst ? 'p-8' : isTopThree ? 'p-6' : 'p-4'}
      `}
    >
      {/* Background Overlay */}
      <span className="absolute inset-0 bg-container/90" />

      {/* Rank Badge */}
      <span className={`
        absolute right-0 top-0 z-10 flex items-center justify-center gap-0.5 px-2
        min-w-[3rem] h-9 rounded-bl-md
        ${isFirst ? 'bg-amber-500' : isTopThree ? 'bg-zinc-500' : 'bg-zinc-400'}
        [background-image:linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]
        [background-size:16px_16px]
      `}>
        <Icon icon="tabler:number" className="w-5 h-5 text-white/90" />
        <span className="text-white font-medium">{index + 1}</span>
      </span>

      <main className="min-w-0 flex-1 relative z-10">
        <section className={`flex gap-4 ${isFirst ? 'flex-col items-center text-center' : 'items-center'}`}>
          {/* Avatar */}
          <Link 
            href={`/user-dashboard?userId=${supporter.profile_id}`}
            className="relative flex-shrink-0"
          >
            <Avatar
              src={supporter.avatar_url || null}
              username={supporter.username || 'Anonymous'}
              size={avatarSize}
              className="ring-2 ring-border hover:ring-primary transition-all"
            />
          </Link>

          {/* User Info */}
          <section className={`min-w-0 flex-1 ${isFirst ? 'w-full' : ''}`}>
            <header className={`flex items-center gap-2 mb-1 ${isFirst ? 'justify-center' : ''}`}>
              <h3 className={`min-w-0 flex-1 font-semibold text-foreground ${isFirst ? 'text-xl' : isTopThree ? 'text-lg' : 'text-base'}`}>
                <Link 
                  href={`/user-dashboard?userId=${supporter.profile_id}`}
                  className="hover:text-primary transition-colors block truncate"
                >
                  {supporter.username || 'Anonymous Supporter'}
                </Link>
              </h3>

              {supporter.role !== 'USER' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary flex-shrink-0">
                  {supporter.role}
                </span>
              )}
            </header>
            
            {supporter.author_bio && isFirst && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {supporter.author_bio}
              </p>
            )}
            {supporter.author_bio && !isFirst && isTopThree && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {supporter.author_bio}
              </p>
            )}
            
            {(supporter.kofi_url || supporter.patreon_url) && (
              <nav className={`flex items-center gap-2 ${isFirst ? 'justify-center' : ''}`}>
                {supporter.kofi_url && (
                  <a
                    href={supporter.kofi_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF5E5B] hover:text-[#FF5E5B]/80 transition-colors text-sm"
                  >
                    Ko-fi
                  </a>
                )}
                {supporter.patreon_url && (
                  <a
                    href={supporter.patreon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF424D] hover:text-[#FF424D]/80 transition-colors text-sm"
                  >
                    Patreon
                  </a>
                )}
              </nav>
            )}
          </section>
        </section>
      </main>
    </article>
  );
};