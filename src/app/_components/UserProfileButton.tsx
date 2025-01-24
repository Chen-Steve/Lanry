'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
  avatar_url?: string;
  role?: string;
}

interface UserProfileButtonProps {
  userProfile: UserProfile | null | undefined;
  isProfileDropdownOpen: boolean;
  setIsProfileDropdownOpen: (isOpen: boolean) => void;
  onSignOut: () => void;
  isMobile?: boolean;
  onMenuClose?: () => void;
}

const UserProfileButton = ({
  userProfile,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  onSignOut,
  isMobile = false,
  onMenuClose
}: UserProfileButtonProps) => {
  const router = useRouter();
  const [isRandomizing, setIsRandomizing] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target as Node) &&
        isProfileDropdownOpen
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen, setIsProfileDropdownOpen]);

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const renderAvatar = () => {
    if (userProfile?.avatar_url) {
      return (
        <Image
          src={userProfile.avatar_url}
          alt={userProfile.username}
          width={32}
          height={32}
          unoptimized
          className="w-8 h-8 rounded-full object-cover"
          onError={() => {
            const target = document.querySelector(`img[alt="${userProfile.username}"]`) as HTMLImageElement;
            if (target) {
              target.remove();
            }
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        {userProfile?.username ? getInitial(userProfile.username) : '?'}
      </div>
    );
  };

  const handleRandomNovel = async () => {
    if (isRandomizing) return;
    
    try {
      setIsRandomizing(true);
      const response = await fetch('/api/novels/random');
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching random novel:', data.error);
        return;
      }
      
      setIsProfileDropdownOpen(false);
      router.push(`/novels/${data.slug}`);
    } catch (error) {
      console.error('Error fetching random novel:', error);
    } finally {
      setIsRandomizing(false);
    }
  };

  const dropdownContent = (
    <>
      <Link
        href="/user-dashboard"
        className="block px-4 py-2 text-sm text-foreground border-b border-border hover:bg-accent transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsProfileDropdownOpen(false);
          onMenuClose?.();
        }}
      >
        <div>
          <div>{userProfile?.username || 'Error loading profile'}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon icon="heroicons:fire" className="w-4 h-4 text-amber-500" />
              {userProfile?.current_streak || 0} day streak
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="ph:coins-fill" className="w-4 h-4 text-amber-500" />
              {userProfile?.coins || 0} coins
            </div>
          </div>
        </div>
      </Link>
      {userProfile?.role && (userProfile.role === 'AUTHOR' || userProfile.role === 'TRANSLATOR') && (
        <Link
          href="/author/dashboard"
          className="block px-4 py-2 text-sm text-foreground border-b border-border hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileDropdownOpen(false);
            onMenuClose?.();
          }}
        >
          <div className="flex items-center gap-2">
            <Icon icon="mdi:pencil" className="text-lg" />
            <span>Author Dashboard</span>
          </div>
        </Link>
      )}
      <button
        onClick={handleRandomNovel}
        disabled={isRandomizing}
        className="block w-full text-left px-4 py-2 text-sm text-foreground border-b border-border hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon 
            icon={isRandomizing ? "eos-icons:loading" : "mdi:dice-6"} 
            className={`text-lg ${isRandomizing ? 'animate-spin' : ''}`}
          />
          <span>Random Novel</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          onSignOut();
          onMenuClose?.();
        }}
        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
      >
        Sign Out
      </button>
    </>
  );

  if (isMobile) {
    return (
      <div className="relative" ref={profileDropdownRef}>
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
        >
          {renderAvatar()}
        </button>
        {isProfileDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-background rounded-lg shadow-lg py-1 z-50 border border-border">
            {dropdownContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={profileDropdownRef}>
      <button
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
      >
        {renderAvatar()}
      </button>
      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-background rounded-lg shadow-lg py-1 z-50 border border-border">
          {dropdownContent}
        </div>
      )}
    </div>
  );
};

export default UserProfileButton; 