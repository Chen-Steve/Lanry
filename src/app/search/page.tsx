import React, { Suspense } from 'react';
import AdvancedSearch from './_components/AdvancedSearch';

export const metadata = {
  title: 'Advanced Search - Lanry',
  description: 'Search novels with advanced filtering options',
};

export default function SearchPage() {
  return (
    <main className="container mx-auto px-1 sm:px-3 max-w-5xl">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      }>
        <AdvancedSearch />
      </Suspense>
    </main>
  );
} 