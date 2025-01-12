'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNavigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Don't render mobile navigation if we're on a chapter page, novel detail page, or author dashboard
  if (
    pathname?.match(/\/novels\/[^/]+\/c\d+/) || 
    pathname?.match(/\/novels\/[^/]+$/) ||
    pathname?.startsWith('/author')
  ) {
    return null;
  }

  const isActive = (path: string) => {
    if (pathname === path) {
      return 'text-foreground bg-accent rounded-lg';
    }
    return 'text-muted-foreground';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 md:hidden">
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
        
        <Link href="/shop" className={`flex flex-col items-center p-2 ${isActive('/shop')}`}>
          <Icon 
            icon="solar:dollar-minimalistic-bold" 
            className="w-6 h-6" 
          />
          <span className="text-xs">Shop</span>
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