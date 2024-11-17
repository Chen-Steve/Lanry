'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
  avatar?: string;
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

  if (isMobile) {
    return (
      <div>
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center w-full px-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
            {userProfile?.username ? getInitial(userProfile.username) : '?'}
          </div>
        </button>
        {isProfileDropdownOpen && (
          <div className="bg-gray-50 py-1">
            <Link
              href="/user-dashboard"
              className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
              onClick={onMenuClose}
            >
              {userProfile?.username}
            </Link>
            <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 flex items-center gap-2">
              <Icon icon="mdi:fire" className={`${userProfile?.current_streak ? 'text-orange-500' : 'text-gray-400'}`} />
              <span>
                {userProfile?.current_streak || 0} day
                {(userProfile?.current_streak || 0) !== 1 ? 's' : ''} streak
              </span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={profileDropdownRef}>
      <button
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
          {userProfile?.username ? getInitial(userProfile.username) : '?'}
        </div>
      </button>
      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <Link
            href="/user-dashboard"
            className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
          >
            {userProfile?.username || 'Error loading profile'}
          </Link>
          <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 flex items-center gap-2">
            <Icon icon="mdi:fire" className={`${userProfile?.current_streak ? 'text-orange-500' : 'text-gray-400'}`} />
            <span>
              {userProfile?.current_streak || 0} day
              {(userProfile?.current_streak || 0) !== 1 ? 's' : ''} streak
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileButton; 