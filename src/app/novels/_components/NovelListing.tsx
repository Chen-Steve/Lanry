'use client';

import { Novel } from '@/types/database';
import { useEffect, useState, useMemo } from 'react';
import { getNovels } from '@/services/novelService';
import NovelCard from './NovelCard';
import LoadingGrid from './LoadingGrid';
import CategoryFilter from './CategoryFilter';
import { useSearchParams, useRouter } from 'next/navigation';

const NovelListing = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get('category') || undefined;

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const data = await getNovels();
        setNovels(data);
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, []);

  const filteredNovels = useMemo(() => {
    if (!selectedCategory) return novels;
    return novels.filter(novel => 
      novel.categories?.some(category => 
        category.name.toLowerCase() === selectedCategory.toLowerCase()
      )
    );
  }, [novels, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    novels.forEach(novel => {
      novel.categories?.forEach(category => {
        counts[category.name] = (counts[category.name] || 0) + 1;
      });
    });
    return counts;
  }, [novels]);

  const handleCategoryChange = (categoryName: string | undefined) => {
    if (categoryName) {
      router.push(`/novels?category=${categoryName.toLowerCase()}`);
    } else {
      router.push('/novels');
    }
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
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        categoryCounts={categoryCounts}
      />
      
      {filteredNovels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No novels found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
          {filteredNovels.map((novel, index) => (
            <NovelCard 
              key={novel.id} 
              novel={novel}
              isPriority={index < 6}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NovelListing; 