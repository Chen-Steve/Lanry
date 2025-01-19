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
import { usePathname, useRouter } from 'next/navigation';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, userId, isLoading, handleSignOut } = useAuth();
  const { userProfile } = useStreak(userId, true);
  const [isRandomizing, setIsRandomizing] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      
      router.push(`/novels/${data.slug}`);
    } catch (error) {
      console.error('Error fetching random novel:', error);
    } finally {
      setIsRandomizing(false);
    }
  };

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
          {userProfile?.role && (userProfile.role === 'AUTHOR' || userProfile.role === 'TRANSLATOR') && (
            <Link
              href="/author/dashboard"
              className="hidden lg:flex text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
            >
              <Icon icon="mdi:pencil" className="text-lg" />
              <span>Author</span>
            </Link>
          )}
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
      <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-4 mb-4 md:mb-8">
        <div className="bg-background border-b border-border rounded-md px-2 sm:px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between max-w-full">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/lanry.jpg"
                alt="Lanry Logo"
                width={32}
                height={32}
                className="hidden md:block w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                quality={95}
                priority
                sizes="(max-width: 640px) 28px, 32px"
              />
            </Link>

            {/* Search and Theme Toggle */}
            <div className="flex items-center flex-1 ml-0 md:ml-4">
              <div className="relative flex-1 min-w-0 flex items-center">
                <SearchSection />
                <div className="flex items-center">
                  <button
                    onClick={handleRandomNovel}
                    disabled={isRandomizing}
                    className="flex-none p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Go to random novel"
                  >
                    <Icon 
                      icon={isRandomizing ? "eos-icons:loading" : "mdi:dice-6"} 
                      className={`text-xl ${isRandomizing ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <div className="flex-none flex items-center">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block flex-shrink-0 ml-4">
              <ul className="flex items-center gap-4">
                <li>
                  <Link 
                    href="https://discord.gg/DXHRpV3sxF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2 inline-flex items-center"
                  >
                    <Icon icon="ic:baseline-discord" className="text-2xl" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/forum"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2 inline-block"
                  >
                    Forum
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