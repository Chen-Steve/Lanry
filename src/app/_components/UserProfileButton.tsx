'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [forumComingSoon, setForumComingSoon] = useState(false);
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-2 space-y-2"
    >
      {/* Profile Header Section */}
      <div className="p-3 bg-accent/50 rounded-lg">
        <div className="flex items-center gap-3">
          {renderAvatar()}
          <div>
            <div className="font-medium">{userProfile?.username || 'Error loading profile'}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Icon icon="ph:coins-fill" className="w-4 h-4 text-amber-500" />
              {userProfile?.coins || 0} coins
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-1">
        <Link
          href="/user-dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileDropdownOpen(false);
            onMenuClose?.();
          }}
        >
          <Icon icon="ph:user" className="text-lg" />
          <span>View Profile</span>
        </Link>

        <button
          onClick={() => setForumComingSoon(true)}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
        >
          <Icon icon="ph:chats" className="text-lg" />
          <span>{forumComingSoon ? "Coming Soon!" : "Forum"}</span>
        </button>

        {userProfile?.role && (userProfile.role === 'AUTHOR' || userProfile.role === 'TRANSLATOR') && (
          <Link
            href="/author/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileDropdownOpen(false);
              onMenuClose?.();
            }}
          >
            <Icon icon="ph:pencil-line" className="text-lg" />
            <span>Author Dashboard</span>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t border-border space-y-1">
        <button
          onClick={handleRandomNovel}
          disabled={isRandomizing}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Icon 
            icon={isRandomizing ? "eos-icons:loading" : "ph:shuffle"} 
            className={`text-lg ${isRandomizing ? 'animate-spin' : ''}`}
          />
          <span>Random Novel</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSignOut();
            onMenuClose?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <Icon icon="ph:sign-out" className="text-lg" />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
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
            <AnimatePresence>
              {dropdownContent}
            </AnimatePresence>
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
        <div className="absolute right-0 mt-1 w-72 bg-background rounded-lg shadow-lg border border-border overflow-hidden">
          <AnimatePresence>
            {dropdownContent}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default UserProfileButton; 