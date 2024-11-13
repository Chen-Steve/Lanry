'use client';

import { useEffect, useState } from 'react';
import NovelListing from '@/components/NovelListing';
import { Novel } from '@/types/database';

export default function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/novels');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setNovels(data);
      } catch (error) {
        console.error('Error fetching novels:', error);
        setError('Failed to load novels. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row max-w-5xl mx-auto bg-white min-h-screen">
      <div className="flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : (
          <NovelListing novels={novels} />
        )}
      </div>
    </div>
  );
}
