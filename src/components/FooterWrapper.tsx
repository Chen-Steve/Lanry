'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const FooterWrapper = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <Footer />;
};

export default FooterWrapper; 