import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Header from './_components/Header';
import Footer from './_components/Footer';
import Providers from './providers';
import { Toaster } from 'react-hot-toast';
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
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7984663674761616"
          crossOrigin="anonymous"
        />
        <Script
          async
          data-cfasync="false"
          src="https://cdn.pubfuture-ad.com/v2/unit/pt.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen relative overflow-x-hidden">
        <Providers>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen max-w-[100vw]">
              <Header />
              <div className="flex-grow flex justify-between w-full">
                {/* Left Ad Column - Hidden on mobile */}
                <div className="hidden lg:block w-[120px] xl:w-[160px] flex-shrink-0 sticky top-0 h-screen">
                  <div className="p-2">
                    {/* Left Ad Container */}
                    <div id="left-ad-container" className="w-full h-[400px]">
                      {/* Your left ad unit code here */}
                    </div>
                  </div>
                </div>
                
                {/* Main Content */}
                <main className="flex-grow max-w-full overflow-x-hidden pr-2">
                  {children}
                </main>
                
                {/* Right Ad Column - Hidden on mobile */}
                <div className="hidden lg:block w-[120px] xl:w-[160px] flex-shrink-0 sticky top-0 h-screen -ml-2">
                  <div className="p-0">
                    {/* Right Ad Container */}
                    <div id="right-ad-container" className="w-full h-[400px]">
                      {/* Your right ad unit code here */}
                    </div>
                  </div>
                </div>
              </div>
              <Footer />
            </div>
            <Toaster position="bottom-right" />
            <CookieConsent />
            <div id="pf-13996-1">
              <Script id="pubfuture-ad-unit">
                {`
                  window.pubfuturetag = window.pubfuturetag || [];
                  window.pubfuturetag.push({unit: "67c7cdf5b588da003cdb26a5", id: "pf-13996-1"})
                `}
              </Script>
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}