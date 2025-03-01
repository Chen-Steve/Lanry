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
import { useScrollDirection } from '@/hooks/useScrollDirection';

const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const pathname = usePathname();

  const menuItems = [
    { icon: "ph:house-bold", label: "Home", href: "/" },
    { icon: "ph:shopping-cart-simple-bold", label: "Shop", href: "/shop" },
    { icon: "mdi:bookmark-multiple", label: "Bookmarks", href: "/bookmarks" },
    { icon: "ic:baseline-discord", label: "Discord", href: "https://discord.gg/DXHRpV3sxF", external: true },
  ];

  return (
    <>
      {/* Backdrop with improved blur and opacity */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Menu with improved styling */}
      <div className={`
        fixed right-0 top-0 h-full w-60 bg-background/95 backdrop-blur-sm
        border-l border-border shadow-lg
        transform transition-all duration-300 ease-out z-50
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-end p-2">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <Icon icon="ph:x-bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-colors
                      ${pathname === item.href ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}
                    `}
                  >
                    <Icon icon={item.icon} className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.external && (
                      <Icon icon="ph:arrow-square-out" className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
              <ThemeToggle />
              <span>Theme</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = () => {
  const pathname = usePathname();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, userId, isLoading, handleSignOut } = useAuth();
  const { userProfile } = useStreak(userId);
  const isVisible = useScrollDirection();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render header on more page or author dashboard
  if (pathname === '/more' || 
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
    <>
      <header className={`w-full sticky top-0 z-40 mb-0 sm:mb-6 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="px-3 sm:px-4 py-2 md:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 flex-1">
                {/* Home Icon */}
                <div className="flex-none">
                  <Link
                    href="/"
                    className="bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90 inline-flex items-center"
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
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                  <ThemeToggle />
                  
                  <Link 
                    href="/shop"
                    className="bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90 inline-flex items-center"
                  >
                    <Icon icon="ph:shopping-cart-simple-bold" className="w-5 h-5" />
                  </Link>

                  <Link 
                    href="https://discord.gg/DXHRpV3sxF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90 inline-flex items-center"
                  >
                    <Icon icon="ic:baseline-discord" className="w-5 h-5" />
                  </Link>

                  <Link 
                    href="/bookmarks"
                    className="bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90 inline-flex items-center"
                  >
                    <Icon icon="mdi:bookmark-multiple" className="w-5 h-5" />
                  </Link>
                </div>

                {/* Shop (always visible) */}
                <div className="flex-none md:hidden">
                  <Link 
                    href="/shop"
                    className="bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90 inline-flex items-center"
                  >
                    <Icon icon="ph:shopping-cart-simple-bold" className="w-5 h-5" />
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden bg-secondary/80 backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/90"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Icon icon="ph:list-bold" className="w-5 h-5" />
                </button>

                {/* Auth Button */}
                <div className="flex-none">
                  {renderAuthLink()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};

export default Header; 