'use client';

import { useIsPWA } from '@/hooks/useIsPWA';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Header from './Header';
import Footer from './Footer';
import BottomBar from './BottomBar';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const isPWA = useIsPWA();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Show BottomBar in PWA mode OR in development mode on mobile
  const shouldShowBottomBar = isPWA || (isDevelopment && isMobile);

  return (
    <div className="flex flex-col min-h-screen max-w-[100vw]">
      {!isPWA && <Header />}
      <div className={`flex-grow flex justify-between w-full ${shouldShowBottomBar ? 'pb-16' : ''}`}>
        {/* Main Content */}
        <main className="flex-grow max-w-full overflow-x-hidden pr-2">
          {children}
        </main>
      </div>
      {!isPWA && <Footer />}
      {shouldShowBottomBar && <BottomBar />}
    </div>
  );
} 