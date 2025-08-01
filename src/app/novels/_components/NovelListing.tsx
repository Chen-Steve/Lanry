'use client';

import { Novel } from '@/types/database';
import { useEffect, useState } from 'react';
import { getNovels, getNovelsWithAdvancedChapters, getTopNovels, getCuratedNovels, getNovelsWithRecentUnlocks } from '@/services/novelService';
import LoadingGrid from './LoadingGrid';
import AdvancedChapters from './AdvancedChapters';
import NewReleases from './NewestNovels';
import FeaturedNovel from './FeaturedNovel';
import RegularNovels from './RegularNovels';
import NovelStatistics from './NovelStatistics';
import CuratedNovels from './CuratedNovels';
import supabase from '@/lib/supabaseClient';
import BulletinBoard from './BulletinBoard';
import CompletedNovels from './CompletedNovels';
import PWABulletin from './PWABulletin';

const NovelListing = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [totalNovels, setTotalNovels] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [advancedNovels, setAdvancedNovels] = useState<Novel[]>([]);
  const [advancedNovelsTotal, setAdvancedNovelsTotal] = useState(0);
  const [recentNovels, setRecentNovels] = useState<Novel[]>([]);
  const [curatedNovels, setCuratedNovels] = useState<Novel[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    // Check if user is logged in
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };
    
    checkUserSession();
  }, []);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        // Fetch novels with recent chapter updates
        const { novels: updatedNovels, total } = await getNovelsWithRecentUnlocks(
          ITEMS_PER_PAGE,
          (currentPage - 1) * ITEMS_PER_PAGE
        );
        
        setNovels(updatedNovels);
        setTotalNovels(total);
        
        // Only fetch featured novels and recent novels on first page load
        if (currentPage === 1) {
          const topNovels = await getTopNovels();
          setFeaturedNovels(topNovels);
          
          // Fetch newest novels (no pagination needed since we only show top 10)
          const { novels: recentNovelsList } = await getNovels({
            limit: 10,
            offset: 0
          });
          setRecentNovels(recentNovelsList);
          
          // Only fetch curated novels if user is logged in
          if (isLoggedIn) {
            const personalizedNovels = await getCuratedNovels();
            setCuratedNovels(personalizedNovels);
          }
        }
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, [currentPage, isLoggedIn]);

  useEffect(() => {
    const fetchAdvancedNovels = async () => {
      try {
        // Fetch only 8 novels to align with the ITEMS_PER_PAGE in AdvancedChapters
        const { novels, total } = await getNovelsWithAdvancedChapters(1, 8);
        console.log('Fetched Advanced Novels:', {
          novelsCount: novels.length,
          total
        });
        setAdvancedNovels(novels);
        setAdvancedNovelsTotal(total);
      } catch (error) {
        console.error('Error fetching advanced novels:', error);
      }
    };

    fetchAdvancedNovels();
  }, []);

  const totalPages = Math.ceil(totalNovels / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the grid
    document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
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
      {featuredNovels.length > 0 && (
        <div className="relative mb-2">
          <FeaturedNovel novels={featuredNovels} />
        </div>
      )}

      <PWABulletin />

      <NewReleases
        recentNovels={recentNovels.map(novel => ({
          id: novel.id,
          slug: novel.slug,
          title: novel.title,
          coverImageUrl: novel.coverImageUrl || null,
          createdAt: novel.created_at
        }))}
        className="mb-2"
      />

      <BulletinBoard />

      {isLoggedIn && <CuratedNovels 
        novels={curatedNovels} 
        className="mb-2"
      />}

      <RegularNovels
        novels={novels}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <CompletedNovels />

      <AdvancedChapters
        initialNovels={advancedNovels}
        initialTotal={advancedNovelsTotal}
      />

      <NovelStatistics />
    </div>
  );
};

export default NovelListing; 