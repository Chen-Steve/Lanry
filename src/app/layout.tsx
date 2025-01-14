import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from './_components/Header';
import Footer from './_components/Footer';
import Providers from './providers';
import { Toaster } from 'react-hot-toast';
import MobileNavigation from './_components/MobileNavigation';
import { ThemeProvider } from '@/lib/ThemeContext';
import Script from 'next/script';

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
    icon: '/lanry.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1969691044413795"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen relative">
        <Providers>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow pb-16 md:pb-0">
                {children}
              </main>
              <div className="hidden md:block">
                <Footer />
              </div>
            </div>
            <Toaster position="bottom-right" />
            <MobileNavigation />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
