'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const HeaderWrapper = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <Header />;
};

export default HeaderWrapper; 