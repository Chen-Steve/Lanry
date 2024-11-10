import type { Metadata } from "next";
import "./globals.css";
import Header from '@/components/Header';

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
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
