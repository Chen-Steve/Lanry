'use client';

import NovelListing from '@/components/NovelListing';

export default function Home() {
  return (
    <div className="flex flex-col sm:flex-row max-w-5xl mx-auto bg-white min-h-screen">
      <div className="flex-grow">
        <NovelListing />
      </div>
    </div>
  );
}
