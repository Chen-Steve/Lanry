'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Don't render header if we're on a chapter page
  if (pathname?.includes('/chapters/')) {
    return null;
  }

  return <Header />;
} 