'use client';

import MobileNavigation from './MobileNavigation';
import { usePathname } from 'next/navigation';

export default function MobileNavigationWrapper() {
  const pathname = usePathname();
  
  // Don't show navigation bar in admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <MobileNavigation />;
} 