'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNavigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Don't render mobile navigation if we're on a chapter page or novel detail page
  if (pathname?.match(/\/novels\/[^/]+\/c\d+/) || pathname?.match(/\/novels\/[^/]+$/)) {
    return null;
  }

  const isActive = (path: string) => {
    if (pathname === path) {
      return 'text-gray-900 bg-gray-100 rounded-lg';
    }
    return 'text-gray-500';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#F2EEE5] border-t border-gray-200 py-2 md:hidden">
      <div className="flex justify-around items-center">
        <Link href="/" className={`flex flex-col items-center p-2 ${isActive('/')}`}>
          <Icon 
            icon="pepicons-print:book" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Browse</span>
        </Link>
        
        <Link href="/forum" className={`flex flex-col items-center p-2 ${isActive('/forum')}`}>
          <Icon 
            icon="pepicons-print:text-bubbles" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Forum</span>
        </Link>
        
        <Link 
          href={isAuthenticated ? "/user-dashboard" : "/auth"} 
          className={`flex flex-col items-center p-2 ${isActive(isAuthenticated ? '/user-dashboard' : '/auth')}`}
        >
          <Icon 
            icon="pepicons-print:person" 
            className="w-6 h-6" 
          />
          <span className="text-xs">{isAuthenticated ? 'Profile' : 'Sign in'}</span>
        </Link>
        
        <Link href="/more" className={`flex flex-col items-center p-2 ${isActive('/more')}`}>
          <Icon 
            icon="pepicons-print:dots-x" 
            className="w-6 h-6" 
          />
          <span className="text-xs">More</span>
        </Link>
      </div>
    </nav>
  );
} 