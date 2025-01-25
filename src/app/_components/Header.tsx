'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import SearchSection from '@/app/_components/SearchSection';
import UserProfileButton from '@/app/_components/UserProfileButton';
import ThemeToggle from '@/app/_components/ThemeToggle';
import { useStreak } from '@/hooks/useStreak';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { isAuthenticated, userId, isLoading, handleSignOut } = useAuth();
  const { userProfile } = useStreak(userId, true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render header on auth page when on mobile
  if (isMobile && pathname === '/auth') {
    return null;
  }

  // Don't render header on more page or user dashboard on mobile
  if (pathname === '/more' || 
      (isMobile && pathname === '/user-dashboard') || 
      (isMobile && pathname.match(/^\/novels\/[^/]+\/[^/]+$/)) ||
      pathname.startsWith('/author/dashboard')) {
    return null;
  }

  const renderAuthLink = () => {
    if (isLoading) {
      return (
        <div className="text-muted-foreground">
          <Icon icon="eos-icons:loading" className="animate-spin" />
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="flex items-center gap-3">
          <UserProfileButton
            userProfile={userProfile}
            isProfileDropdownOpen={isProfileDropdownOpen}
            setIsProfileDropdownOpen={setIsProfileDropdownOpen}
            onSignOut={() => {
              handleSignOut();
              setIsProfileDropdownOpen(false);
            }}
            isMobile={isMobile}
          />
        </div>
      );
    }

    return (
      <Link 
        href="/auth" 
        className="bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/80 inline-flex items-center gap-2"
      >
        <Icon icon="ph:user-bold" className="w-5 h-5" />
        <span className="hidden sm:inline">Sign in/up</span>
      </Link>
    );
  };

  return (
    <header className="w-full bg-background sticky top-0 z-50 mb-0 sm:mb-6">
      <div className="max-w-5xl mx-auto">
        <div className="px-3 sm:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 flex-1">
              {/* Home Icon */}
              <div className="flex-none">
                <Link
                  href="/"
                  className="bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/80 inline-flex items-center"
                >
                  <Icon icon="ph:house-bold" className="w-5 h-5" />
                </Link>
              </div>

              {/* Search Bar */}
              <div className="flex-1">
                <SearchSection onExpandChange={setIsSearchExpanded} />
              </div>
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-2 sm:gap-4 transition-all duration-300 ${
              isSearchExpanded ? 'hidden sm:flex' : 'flex'
            }`}>
              {/* Theme Toggle */}
              <div className="flex-none">
                <ThemeToggle />
              </div>

              {/* Shop Link */}
              <div className="flex-none">
                <Link 
                  href="/shop"
                  className="bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/80 inline-flex items-center"
                >
                  <Icon icon="ph:shopping-cart-simple-bold" className="w-5 h-5" />
                </Link>
              </div>

              {/* Discord Link */}
              <div className="flex-none">
                <Link 
                  href="https://discord.gg/DXHRpV3sxF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/80 inline-flex items-center"
                >
                  <Icon icon="ic:baseline-discord" className="w-5 h-5" />
                </Link>
              </div>

              {/* Auth Button */}
              <div className="flex-none">
                {renderAuthLink()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 