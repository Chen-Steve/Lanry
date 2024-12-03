import type { Metadata } from "next";
import "./globals.css";
import HeaderWrapper from '@/components/HeaderWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import Providers from '@/components/Providers';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { Toaster } from 'react-hot-toast';
import MobileNavigationWrapper from '@/components/MobileNavigationWrapper';

export const metadata: Metadata = {
  title: "Lanry",
  description: "read light novel",
  metadataBase: new URL('https://lanry.space'),
  openGraph: {
    title: 'Lanry',
    description: 'read light novel',
    type: 'website',
  },
  icons: {
    icon: '/download.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen relative">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <HeaderWrapper />
            <main className="flex-grow pb-16 md:pb-0">
              {children}
            </main>
            <div className="hidden md:block">
              <FooterWrapper />
            </div>
          </div>
          <Toaster position="bottom-right" />
          <AnalyticsProvider />
          <MobileNavigationWrapper />
        </Providers>
      </body>
    </html>
  );
}
