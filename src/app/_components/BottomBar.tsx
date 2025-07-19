'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useEffect, useState } from 'react';

export default function BottomBar() {
  const pathname = usePathname();
  const { isAuthenticated, userId } = useAuth();
  const { userProfile } = useUserProfile(userId);
  const isPWA = useIsPWA();

  // iOS detection
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream);
    }
  }, []);

  // Only render in PWA mode and not on chapter pages
  if (!isPWA || (pathname.includes('/novels/') && pathname.split('/').length > 3)) {
    return null;
  }

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const baseNavItems = [
    {
      href: '/',
      label: 'Home',
      icon: 'heroicons:home',
      activeIcon: 'heroicons:home-solid',
      isActive: pathname === '/'
    },
    {
      href: '/search',
      label: 'Series',
      icon: 'heroicons:magnifying-glass',
      activeIcon: 'heroicons:magnifying-glass-solid',
      isActive: pathname.startsWith('/search')
    },
    {
      href: '/bookmarks',
      label: 'Library',
      icon: 'heroicons:bookmark',
      activeIcon: 'heroicons:bookmark-solid',
      isActive: pathname.startsWith('/bookmarks')
    },
    // Store button only for authenticated users
    ...(isAuthenticated ? [{
      href: '/shop',
      label: 'Store',
      icon: 'heroicons:shopping-bag',
      activeIcon: 'heroicons:shopping-bag-solid',
      isActive: pathname.startsWith('/shop')
    }] : [])
  ];

  // Profile item changes based on authentication status
  const profileItem = isAuthenticated
    ? {
        href: '/user-dashboard',
        label: 'Profile',
        icon: 'heroicons:user',
        activeIcon: 'heroicons:user-solid',
        isActive: pathname.startsWith('/user-dashboard'),
        hasAvatar: true
      }
    : {
        href: '/auth',
        label: 'Sign In',
        icon: 'heroicons:user',
        activeIcon: 'heroicons:user-solid',
        isActive: pathname.startsWith('/auth'),
        hasAvatar: false
      };

  const navItems = [...baseNavItems, profileItem];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
      <nav className={`flex justify-around items-center py-2 px-4 safe-area-inset-bottom${isIOS ? ' pb-4' : ''}`}>
        {navItems.map((item) => {
          const isAuthenticatedProfile = 'hasAvatar' in item && item.hasAvatar;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors duration-200 min-w-0 flex-1 ${
                item.isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {isAuthenticatedProfile ? (
                <div className="relative">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.username || 'Profile'}
                      className="w-6 h-6 rounded-full object-cover border-2 border-transparent"
                      style={{
                        borderColor: item.isActive ? 'rgb(37 99 235)' : 'transparent'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback by triggering re-render
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-transparent ${
                        item.isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-500 dark:bg-gray-600 text-white'
                      }`}
                      style={{
                        borderColor: item.isActive ? 'rgb(37 99 235)' : 'transparent'
                      }}
                    >
                      {userProfile?.username ? getInitial(userProfile.username) : '?'}
                    </div>
                  )}
                  {item.isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </div>
              ) : (
                <Icon icon={item.isActive ? item.activeIcon : item.icon} className="w-6 h-6" />
              )}
              <span className="text-xs font-medium truncate mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 