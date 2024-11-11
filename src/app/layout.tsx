import type { Metadata } from "next";
import "./globals.css";
import HeaderWrapper from '@/components/HeaderWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: "LightNovel Database",
  description: "A modern database for light novel enthusiasts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <HeaderWrapper />
            <main className="flex-grow">
              {children}
            </main>
            <FooterWrapper />
          </div>
        </Providers>
      </body>
    </html>
  );
}
