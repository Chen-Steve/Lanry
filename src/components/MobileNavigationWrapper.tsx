'use client';

import MobileNavigation from './MobileNavigation';
import { usePathname } from 'next/navigation';

export default function MobileNavigationWrapper() {
  const pathname = usePathname();
  
  // Don't render mobile navigation if we're on a chapter page
  if (pathname?.includes('/chapters/')) {
    return null;
  }

  return <MobileNavigation />;
} 