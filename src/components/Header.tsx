'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import SearchSection from './SearchSection';
import type { Novel } from '@/types/database';
import UserProfileButton from './UserProfileButton';
import { useStreak } from '@/hooks/useStreak';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { isAuthenticated, userId, isLoading, handleSignOut } = useAuth();
  const { userProfile } = useStreak(userId);

  const renderAuthLink = () => {
    if (isLoading) {
      return (
        <div className="text-gray-400">
          <Icon icon="eos-icons:loading" className="animate-spin" />
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <UserProfileButton
          userProfile={userProfile}
          isProfileDropdownOpen={isProfileDropdownOpen}
          setIsProfileDropdownOpen={setIsProfileDropdownOpen}
          onSignOut={() => {
            handleSignOut();
            setIsProfileDropdownOpen(false);
            setIsMenuOpen(false);
          }}
        />
      );
    }

    return (
      <Link href="/auth" className="text-gray-600 hover:text-gray-800 transition-colors">
        Sign In
      </Link>
    );
  };

  const handleSearchResults = (query: string, results: Novel[]) => {
    // Handle search results here if needed
    console.log('Search results:', results);
  };

  return (
    <header className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-4 mt-4 sm:mt-8 mb-6 sm:mb-10">
        <div className="bg-white border-b border-black rounded-md px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between space-x-4">
            {/* Logo */}
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
              Lanry
            </Link>

            {/* Search Section */}
            <div className="hidden md:block">
              <SearchSection onSearch={handleSearchResults} />
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 md:hidden"
              aria-label="Toggle menu"
            >
              <Icon 
                icon={isMenuOpen ? "mdi:close" : "mdi:menu"} 
                className="text-2xl text-gray-600"
              />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <ul className="flex items-center space-x-6">
                <li>
                  <Link 
                    href="/forum"
                    className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer py-1.5 inline-block"
                  >
                    Forum
                  </Link>
                </li>
                <li>
                  <Link href="/sponsors" className="text-gray-600 hover:text-gray-800 transition-colors py-1.5 inline-block">
                    Sponsors
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop" 
                    className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md hover:bg-amber-200 transition-colors flex items-center gap-2 h-[34px]"
                  >
                    <Icon icon="ph:coins" className="text-amber-600" />
                    <span>Coins</span>
                    {userProfile && (
                      <span className="rounded-md text-sm">
                        {userProfile.coins || 0}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  {renderAuthLink()}
                </li>
              </ul>
            </nav>
          </div>

          {/* Move search to mobile menu */}
          {isMenuOpen && (
            <nav className="md:hidden border-t border-gray-200 mt-2">
              <div className="py-2">
                <SearchSection onSearch={handleSearchResults} />
              </div>
              <ul className="py-1 space-y-1">
                <li>
                  <Link 
                    href="/forum"
                    className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Forum
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/sponsors" 
                    className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sponsors
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop" 
                    className="block px-2 py-1.5 text-sm text-gray-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors px-2 py-1 rounded-md">
                      <Icon icon="ph:coins" className="text-amber-600" />
                      <span>Coins</span>
                      {userProfile && (
                        <span className="rounded-md text-sm">
                          {userProfile.coins || 0}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
                <li>
                  {isAuthenticated ? (
                    <UserProfileButton
                      userProfile={userProfile}
                      isProfileDropdownOpen={isProfileDropdownOpen}
                      setIsProfileDropdownOpen={setIsProfileDropdownOpen}
                      onSignOut={() => {
                        handleSignOut();
                        setIsProfileDropdownOpen(false);
                        setIsMenuOpen(false);
                      }}
                      isMobile
                      onMenuClose={() => setIsMenuOpen(false)}
                    />
                  ) : (
                    <Link 
                      href="/auth" 
                      className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;