'use client';

import { useState, useEffect } from 'react';
import { Novel } from '@/types/database';
import CompletedNovelList from './_components/CompletedNovelList';
import LoadingGrid from '../_components/LoadingGrid';
import { getCompletedNovels } from '@/services/novelService';

const ITEMS_PER_PAGE = 35;

export default function CompletedNovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [totalNovels, setTotalNovels] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setIsLoading(true);
        const { novels, total } = await getCompletedNovels(currentPage, ITEMS_PER_PAGE);
        setNovels(novels);
        setTotalNovels(total);
      } catch (error) {
        console.error('Error fetching completed novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, [currentPage]);

  const totalPages = Math.ceil(totalNovels / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg mb-6"></div>
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <CompletedNovelList
        novels={novels}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
} 