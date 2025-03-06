'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import Script from 'next/script';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Lanry
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Your destination for light novels and web novels
            </p>
            <Link
              href="/novels"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Icon icon="mdi:book-open-page-variant" className="w-6 h-6" />
              <span>Start Reading</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Unit Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div id="pf-13998-1">
              <Script
                id="pubfuture-ad"
                dangerouslySetInnerHTML={{
                  __html: `window.pubfuturetag = window.pubfuturetag || [];
                  window.pubfuturetag.push({unit: "67c7d9a804d811003cdb6267", id: "pf-13998-1"})`
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <Icon icon="mdi:book-multiple" className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Extensive Library</h3>
              <p className="text-muted-foreground">Access a vast collection of light novels and web novels</p>
            </div>
            <div className="text-center p-6">
              <Icon icon="mdi:translate" className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Quality Translations</h3>
              <p className="text-muted-foreground">Enjoy carefully translated content from multiple languages</p>
            </div>
            <div className="text-center p-6">
              <Icon icon="mdi:bookmark-multiple" className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Bookmarking</h3>
              <p className="text-muted-foreground">Keep track of your favorite novels and reading progress</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
