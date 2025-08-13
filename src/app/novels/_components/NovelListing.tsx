'use client';

import { Novel } from '@/types/database';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getNovelsWithAdvancedChapters, getNovelsWithRecentUnlocks } from '@/services/novelService';
import LoadingGrid from './LoadingGrid';
import AdvancedChapters from './AdvancedChapters';
import NewReleases from './NewestNovels';
import FeaturedNovel from './FeaturedNovel';
import RegularNovels from './RecentlyUpdated';
import NovelStatistics from './NovelStatistics';
import CuratedNovels from './CuratedNovels';
import supabase from '@/lib/supabaseClient';
import BulletinBoard, { PWABulletin, CompletedNovels } from './BulletinBoard';

const NovelListing = () => {
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const queryClient = useQueryClient();

  const ITEMS_PER_PAGE = 14;

	useEffect(() => {
		const checkUserSession = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			setIsLoggedIn(!!session?.user);
		};
		checkUserSession();
	}, []);

	// Paginated novels with recent unlocks
	const { data: recentData, isLoading: isRecentLoading } = useQuery<{ novels: Novel[]; total: number }>({
		queryKey: ['novels', 'recentUnlocks', currentPage],
		queryFn: () => getNovelsWithRecentUnlocks(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE),
		placeholderData: keepPreviousData,
		staleTime: 60_000,
	});

	// Prefetch the next page for smoother pagination
	useEffect(() => {
		if (!recentData) return;
		const totalPages = Math.ceil((recentData.total || 0) / ITEMS_PER_PAGE);
		if (currentPage < totalPages) {
			queryClient.prefetchQuery({
				queryKey: ['novels', 'recentUnlocks', currentPage + 1],
				queryFn: () => getNovelsWithRecentUnlocks(ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
				staleTime: 60_000,
			});
		}
	}, [recentData, currentPage, queryClient]);

	// Section-specific queries moved into components

	// Advanced chapters section
	const { data: advancedData } = useQuery<{ novels: Novel[]; total: number }>({
		queryKey: ['novels', 'advanced', 1, 8],
		queryFn: () => getNovelsWithAdvancedChapters(1, 8),
		staleTime: 300_000,
	});

	const novels: Novel[] = recentData?.novels ?? [];
	const totalNovels = recentData?.total ?? 0;
	const totalPages = Math.ceil(totalNovels / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the grid
    document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' });
  };

	if (isRecentLoading && !recentData) {
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg mb-6"></div>
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4">
      {/* Featured Novels */}
      <div className="relative mb-2">
        <FeaturedNovel />
      </div>

      <PWABulletin />

      <NewReleases className="mb-2" />

      <BulletinBoard />

      {isLoggedIn && (
        <CuratedNovels className="mb-2" />
      )}

      <RegularNovels
				novels={novels}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <CompletedNovels />

      <AdvancedChapters
        initialNovels={advancedData?.novels ?? []}
        initialTotal={advancedData?.total ?? 0}
      />

      <NovelStatistics />
    </div>
  );
};

export default NovelListing; 