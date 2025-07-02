'use client';

import { usePWA } from '@/hooks/usePWA';
import Header from './Header';
import Footer from './Footer';
import BottomBar from './BottomBar';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const isPWA = usePWA();

  return (
    <div className="flex flex-col min-h-screen max-w-[100vw]">
      {!isPWA && <Header />}
      <div className={`flex-grow flex justify-between w-full ${isPWA ? 'pb-16' : 'pb-16 md:pb-0'}`}>
        {/* Main Content */}
        <main className="flex-grow max-w-full overflow-x-hidden pr-2">
          {children}
        </main>
      </div>
      {!isPWA && <Footer />}
      <BottomBar />
    </div>
  );
} 