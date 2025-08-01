import React from 'react';
import AdvancedSearch from './_components/AdvancedSearch';

export const metadata = {
  title: 'Advanced Search - Lanry',
  description: 'Search novels with advanced filtering options',
};

export default function SearchPage() {
  return (
    <main className="container mx-auto px-1 sm:px-3 max-w-5xl">
      <AdvancedSearch />
    </main>
  );
} 