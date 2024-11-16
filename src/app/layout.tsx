import type { Metadata } from "next";
import "./globals.css";
import HeaderWrapper from '@/components/HeaderWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import Providers from '@/components/Providers';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { Toaster } from 'react-hot-toast';
import LavaBlobs from '@/components/LavaBlobs';

export const metadata: Metadata = {
  title: "Lanry",
  description: "read light novel",
  metadataBase: new URL('https://lanry.vercel.app'),
  openGraph: {
    title: 'Lanry',
    description: 'read light novel',
    type: 'website',
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
        <LavaBlobs />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <HeaderWrapper />
            <main className="flex-grow">
              {children}
            </main>
            <FooterWrapper />
          </div>
          <Toaster position="bottom-right" />
          <AnalyticsProvider />
        </Providers>
      </body>
    </html>
  );
}
