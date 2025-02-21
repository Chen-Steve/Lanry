'use client';

import { Novel } from '@/types/database';
import { useEffect, useState } from 'react';
import { getNovels, getNovelsWithAdvancedChapters, getTopNovels } from '@/services/novelService';
import LoadingGrid from './LoadingGrid';
import AdvancedChapters from './AdvancedChapters';
import NewReleases from './RecentReleases';
import FeaturedNovel from './FeaturedNovel';
import RegularNovels from './RegularNovels';
import TranslatorProfiles from './TranslatorProfiles';
import { getTranslators, Translator } from '@/services/translatorService';

const NovelListing = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [totalNovels, setTotalNovels] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [advancedNovels, setAdvancedNovels] = useState<Novel[]>([]);
  const [recentAdvancedNovels, setRecentAdvancedNovels] = useState<Novel[]>([]);
  const [translators, setTranslators] = useState<Translator[]>([]);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        // Fetch all novels with pagination
        const { novels: allNovels, total } = await getNovels({
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE
        });
        
        setNovels(allNovels);
        setTotalNovels(total);
        
        // Only fetch featured novels on first page load
        if (currentPage === 1) {
          const topNovels = await getTopNovels();
          setFeaturedNovels(topNovels);
        }
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, [currentPage]);

  useEffect(() => {
    const fetchAdvancedNovels = async () => {
      try {
        const novels = await getNovelsWithAdvancedChapters();
        setAdvancedNovels(novels);
        
        // Set recent advanced novels (top 10 most recent)
        setRecentAdvancedNovels(novels.slice(0, 10));
      } catch (error) {
        console.error('Error fetching advanced novels:', error);
      }
    };

    fetchAdvancedNovels();
  }, []);

  useEffect(() => {
    const fetchTranslators = async () => {
      try {
        const data = await getTranslators();
        console.log('Fetched translators:', data);
        setTranslators(data);
      } catch (error) {
        console.error('Error fetching translators:', error);
      }
    };

    fetchTranslators();
  }, []);

  const totalPages = Math.ceil(totalNovels / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the grid
    document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="max-w-5xl mx-auto px-4 -mt-4 sm:-mt-8">
      {/* Featured Novels */}
      {featuredNovels.length > 0 && (
        <div className="relative pt-4 sm:pt-0">
          <FeaturedNovel novels={featuredNovels} />
        </div>
      )}

      <NewReleases
        recentNovels={recentAdvancedNovels.map(novel => ({
          id: novel.id,
          slug: novel.slug,
          title: novel.title,
          coverImageUrl: novel.coverImageUrl || null,
          chaptersCount: novel.chapters?.length || 0,
          status: novel.status,
          created_at: new Date(novel.created_at)
        }))}
      />

      <RegularNovels
        novels={novels}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <TranslatorProfiles translators={translators} />

      <AdvancedChapters
        novels={advancedNovels}
      />
    </div>
  );
};

export default NovelListing; 