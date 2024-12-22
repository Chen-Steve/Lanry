'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import SearchSection from '@/app/_components/SearchSection';
import UserProfileButton from '@/app/_components/UserProfileButton';
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
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render header on more page or user dashboard on mobile
  if (pathname === '/more' || 
      (isMobile && pathname === '/user-dashboard') || 
      (isMobile && pathname.match(/^\/novels\/[^/]+\/[^/]+$/))) {
    return null;
  }

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
        <div className="flex items-center gap-3">
          <Link
            href="/author/dashboard"
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
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
      <Link href="/auth" className="text-gray-600 hover:text-gray-800 transition-colors">
        Sign In
      </Link>
    );
  };

  return (
    <header className="w-full bg-[#F2EEE5]">
      <div className="max-w-5xl mx-auto px-4 mt-2 md:mt-8 mb-3 md:mb-10">
        <div className="bg-[#F2EEE5] border-b border-black rounded-md px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center md:justify-between md:space-x-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image
                src="/lanry.jpg"
                alt="Lanry Logo"
                width={32}
                height={32}
                className="rounded-full"
                quality={95}
                priority
                sizes="32px"
              />
              <span className="hidden md:block text-lg md:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
                Lanry
              </span>
            </Link>

            {/* Mobile View: Search */}
            <div className="flex-1 ml-4 md:hidden">
              <SearchSection />
            </div>

            {/* Desktop View: Search */}
            <div className="hidden md:block">
              <SearchSection />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <ul className="flex items-center space-x-4">
                <li>
                  <Link 
                    href="/forum"
                    className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer py-1 inline-block"
                  >
                    Forum
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/novels/requests"
                    className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer py-1 inline-block flex items-center gap-1"
                  >
                    <span>Requests</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop" 
                    className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md hover:bg-amber-200 transition-colors flex items-center gap-1.5 h-[32px]"
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