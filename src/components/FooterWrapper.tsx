'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const FooterWrapper = () => {
  const pathname = usePathname();
  const isAuthorDashboard = pathname?.startsWith('/author/dashboard');
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAuthorDashboard || isAdminRoute) {
    return null;
  }

  return <Footer />;
};

export default FooterWrapper; 