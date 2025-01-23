'use client';

import { Novel } from '@/types/database';
import { useEffect, useState, useMemo } from 'react';
import { getNovels } from '@/services/novelService';
import NovelCard from './NovelCard';
import LoadingGrid from './LoadingGrid';
import CategoryFilter from './CategoryFilter';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import NovelCover from './NovelCover';

const NovelListing = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedSection, setShowAdvancedSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showAdvancedSection');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategories = useMemo(() => 
    searchParams.get('categories')?.split(',').filter(Boolean) || [], 
    [searchParams]
  );

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showAdvancedSection', JSON.stringify(showAdvancedSection));
    }
  }, [showAdvancedSection]);

  const filteredNovels = useMemo(() => {
    if (selectedCategories.length === 0) return novels;
    return novels.filter(novel => 
      novel.categories?.some(category => 
        selectedCategories.includes(category.name.toLowerCase())
      )
    );
  }, [novels, selectedCategories]);

  const advancedNovels = useMemo(() => {
    return filteredNovels.filter(novel => 
      novel.chapters?.some(chapter => {
        const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
        return publishDate && publishDate > new Date() && chapter.coins > 0;
      })
    );
  }, [filteredNovels]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    novels.forEach(novel => {
      novel.categories?.forEach(category => {
        counts[category.name] = (counts[category.name] || 0) + 1;
      });
    });
    return counts;
  }, [novels]);

  const handleCategoriesChange = (categoryNames: string[]) => {
    if (categoryNames.length > 0) {
      router.push(`/novels?categories=${categoryNames.map(cat => cat.toLowerCase()).join(',')}`);
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
    <div className="max-w-5xl mx-auto px-4 -mt-6">
      <CategoryFilter
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
        categoryCounts={categoryCounts}
        className="mb-2"
      />
      
      {/* Advanced Chapters Section */}
      {advancedNovels.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowAdvancedSection(!showAdvancedSection)}
            className="w-full flex items-center justify-between p-3 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors mb-2"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium">Advanced Chapters</h2>
            </div>
            <Icon 
              icon={showAdvancedSection ? "mdi:chevron-up" : "mdi:chevron-down"} 
              className="w-5 h-5 text-muted-foreground"
            />
          </button>
          
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 transition-all duration-300 ${
            showAdvancedSection 
              ? 'opacity-100 max-h-[2000px]' 
              : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            {advancedNovels.map(novel => {
              const advancedChapters = novel.chapters?.filter(chapter => {
                const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
                return publishDate && publishDate > new Date() && chapter.coins > 0;
              })
              .sort((a, b) => {
                const dateA = a.publish_at ? new Date(a.publish_at) : new Date();
                const dateB = b.publish_at ? new Date(b.publish_at) : new Date();
                return dateA.getTime() - dateB.getTime();
              })
              .slice(0, 3) || [];
              
              return (
                <Link
                  key={novel.id}
                  href={`/novels/${novel.slug}`}
                  className="group relative flex gap-2 p-2 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors"
                >
                  <div className="w-16 h-24 relative rounded-md overflow-hidden">
                    <NovelCover
                      coverUrl={novel.coverImageUrl}
                      title={novel.title}
                      isPriority={true}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {novel.title}
                    </h3>
                    
                    <div className="mt-1 space-y-0.5">
                      {advancedChapters.map(chapter => (
                        <div key={chapter.id} className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">
                            Ch.{chapter.chapter_number}
                            {chapter.part_number && `.${chapter.part_number}`}
                          </span>
                          <span className="text-primary">
                            {chapter.publish_at && new Date(chapter.publish_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      
      {filteredNovels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No novels found in the selected categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 pb-20">
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