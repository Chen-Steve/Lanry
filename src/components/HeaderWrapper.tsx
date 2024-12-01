'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import { useEffect, useState } from 'react';

const HeaderWrapper = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isAuthorDashboard = pathname?.startsWith('/author/dashboard');
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAuthorDashboard || isAdminRoute || isMobile) {
    return null;
  }

  return <Header />;
};

export default HeaderWrapper; 