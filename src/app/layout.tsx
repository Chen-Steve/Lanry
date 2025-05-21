import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Header from './_components/Header';
import Footer from './_components/Footer';
import Providers from './providers';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/lib/ThemeContext';
import CookieConsent from './_components/CookieConsent';

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
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
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
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
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
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7984663674761616"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen relative overflow-x-hidden">
        <Providers>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen max-w-[100vw]">
              <Header />
              <div className="flex-grow flex justify-between w-full">
                {/* Main Content */}
                <main className="flex-grow max-w-full overflow-x-hidden pr-2">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
            <Toaster position="bottom-right" />
            <CookieConsent />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}