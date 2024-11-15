'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const HeaderWrapper = () => {
  const pathname = usePathname();
  const isAuthorDashboard = pathname?.startsWith('/author/dashboard');
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAuthorDashboard || isAdminRoute) {
    return null;
  }

  return <Header />;
};

export default HeaderWrapper; 