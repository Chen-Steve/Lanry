import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Header from './_components/Header';
import Footer from './_components/Footer';
import Providers from './providers';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/lib/ThemeContext';
import CookieConsent from './_components/CookieConsent';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AnalyticsWrapper from './_components/AnalyticsWrapper';

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
        <Script id="google-analytics-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Set default consent mode
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `}
        </Script>
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-PVZ6V89JEJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            gtag('js', new Date());
            gtag('config', 'G-PVZ6V89JEJ');
          `}
        </Script>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1969691044413795"
          crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-screen relative">
        <Providers>
          <ThemeProvider>
            <AnalyticsWrapper>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster position="bottom-right" />
              <CookieConsent />
            </AnalyticsWrapper>
          </ThemeProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
