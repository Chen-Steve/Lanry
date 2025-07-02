'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

export default function BottomBar() {
  const pathname = usePathname();

  const navItems = [
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
    {
      href: '/shop',
      label: 'Store',
      icon: 'heroicons:shopping-bag',
      activeIcon: 'heroicons:shopping-bag-solid',
      isActive: pathname.startsWith('/shop')
    },
    {
      href: '/user-dashboard',
      label: 'Profile',
      icon: 'heroicons:user',
      activeIcon: 'heroicons:user-solid',
      isActive: pathname.startsWith('/user-dashboard')
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
      <nav className="flex justify-around items-center py-2 px-4 safe-area-inset-bottom">
        {navItems.map((item) => {
          const iconName = item.isActive ? item.activeIcon : item.icon;
          
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
              <Icon icon={iconName} className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 