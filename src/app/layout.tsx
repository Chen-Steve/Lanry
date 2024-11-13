import type { Metadata } from "next";
import "./globals.css";
import HeaderWrapper from '@/components/HeaderWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import Providers from '@/components/Providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Lanry",
  description: "read light novel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <HeaderWrapper />
            <main className="flex-grow">
              {children}
            </main>
            <FooterWrapper />
          </div>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
