'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import Image from 'next/image';
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
          <Link
            href="/author/dashboard"
            className="hidden lg:flex text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
          >
            <Icon icon="mdi:pencil" className="text-lg" />
            <span>Author</span>
          </Link>
          <UserProfileButton
            userProfile={userProfile}
            isProfileDropdownOpen={isProfileDropdownOpen}
            setIsProfileDropdownOpen={setIsProfileDropdownOpen}
            onSignOut={() => {
              handleSignOut();
              setIsProfileDropdownOpen(false);
            }}
          />
        </div>
      );
    }

    return (
      <Link href="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
        Sign In
      </Link>
    );
  };

  return (
    <header className="w-full bg-background">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-2 sm:mt-4 md:mt-6 lg:mt-8 mb-3 md:mb-6 lg:mb-10">
        <div className="bg-background border-b border-border rounded-md px-2 sm:px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-full">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image
                src="/lanry.jpg"
                alt="Lanry Logo"
                width={32}
                height={32}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                quality={95}
                priority
                sizes="(max-width: 640px) 28px, 32px"
              />
              <span className="hidden sm:block text-lg md:text-xl lg:text-2xl font-bold text-foreground hover:text-muted-foreground transition-colors">
                Lanry
              </span>
            </Link>

            {/* Search and Theme Toggle */}
            <div className="flex items-center flex-1 max-w-xl">
              <div className="relative flex-1 min-w-0">
                <SearchSection />
              </div>
              <div className="flex-none mr-6 sm:mr-0">
                <ThemeToggle />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block flex-shrink-0">
              <ul className="flex items-center gap-2 lg:gap-4">
                <li>
                  <Link 
                    href="/forum"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 inline-block"
                  >
                    Forum
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/novels/requests"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 inline-block flex items-center gap-1"
                  >
                    <span>Requests</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop" 
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-2 lg:px-2.5 py-1 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors flex items-center gap-1.5 h-[32px]"
                  >
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
        </div>
      </div>
    </header>
  );
};

export default Header; 