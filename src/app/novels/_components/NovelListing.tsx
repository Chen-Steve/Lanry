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
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showAdvancedSection, setShowAdvancedSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showAdvancedSection');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategories = useMemo(() => ({
    included: searchParams.get('include')?.split(',').filter(Boolean) || [],
    excluded: searchParams.get('exclude')?.split(',').filter(Boolean) || []
  }), [searchParams]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setFeaturedIndex(prev => 
        prev === featuredNovels.length - 1 ? 0 : prev + 1
      );
    }
    if (isRightSwipe) {
      setFeaturedIndex(prev => 
        prev === 0 ? featuredNovels.length - 1 : prev - 1
      );
    }
  };

  // Function to get a seeded random number based on the current date and an index
  const getSeededRandom = (index: number) => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash = hash & hash;
    }
    // Add the index to get different random numbers from the same date
    const finalHash = (hash + index) / 10000000;
    return finalHash - Math.floor(finalHash);
  };

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const data = await getNovels();
        setNovels(data);
        
        // Create a deterministic shuffle based on the current date
        const shuffled = [...data].sort((a, b) => {
          const indexA = data.indexOf(a);
          const indexB = data.indexOf(b);
          return getSeededRandom(indexA) - getSeededRandom(indexB);
        });
        
        // Get 5 random novels for featured section, excluding the first 6
        const featuredSelection = shuffled
          .slice(6)
          .slice(0, 5);
        
        setFeaturedNovels(featuredSelection);
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
    if (selectedCategories.included.length === 0 && selectedCategories.excluded.length === 0) return novels;
    return novels.filter(novel => 
      novel.categories?.some(category => {
        const catName = category.name.toLowerCase();
        return selectedCategories.included.includes(catName) && !selectedCategories.excluded.includes(catName);
      })
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

  const handleCategoriesChange = (categories: { included: string[]; excluded: string[] }) => {
    const params = new URLSearchParams();
    if (categories.included.length > 0) {
      params.set('include', categories.included.join(','));
    }
    if (categories.excluded.length > 0) {
      params.set('exclude', categories.excluded.join(','));
    }
    router.push(params.toString() ? `/novels?${params.toString()}` : '/novels');
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
          {/* Featured Novel Container */}
          {featuredNovels.length > 0 && (
            <Link
              href={`/novels/${featuredNovels[featuredIndex].slug}`}
              className="col-span-3 group relative flex gap-4 p-3 bg-card hover:bg-accent/50 border-2 border-black dark:border-white rounded-lg transition-colors h-full touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => {
                // Only navigate if we haven't just finished a swipe
                if (touchStart && touchEnd && Math.abs(touchStart - touchEnd) > minSwipeDistance) {
                  e.preventDefault();
                }
              }}
            >
              {/* Left Arrow */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setFeaturedIndex(prev => prev === 0 ? featuredNovels.length - 1 : prev - 1);
                }}
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
                aria-label="Previous novel"
              >
                <Icon icon="mdi:chevron-left" className="text-xl" />
              </button>

              {/* Right Arrow */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setFeaturedIndex(prev => prev === featuredNovels.length - 1 ? 0 : prev + 1);
                }}
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full"
                aria-label="Next novel"
              >
                <Icon icon="mdi:chevron-right" className="text-xl" />
              </button>

              <div className="h-full aspect-[3/4] relative rounded-md overflow-hidden">
                <NovelCover
                  coverUrl={featuredNovels[featuredIndex].coverImageUrl}
                  title={featuredNovels[featuredIndex].title}
                  isPriority={true}
                  size="medium"
                />
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col py-0.5 overflow-hidden">
                <div className="flex-1 min-h-0">
                  <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {featuredNovels[featuredIndex].title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 overflow-hidden">
                    {featuredNovels[featuredIndex].description}
                  </p>
                  <div className="hidden sm:flex items-center gap-1.5 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon 
                        key={star}
                        icon="material-symbols:star-rounded"
                        className={`text-lg ${
                          star <= (featuredNovels[featuredIndex].rating || 0)
                            ? 'text-yellow-500'
                            : 'text-yellow-500/30'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium ml-1">
                      {featuredNovels[featuredIndex].rating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon icon="pepicons-print:book" className="text-base" />
                      {featuredNovels[featuredIndex].chapters?.length || 0} Chapters
                    </span>
                    {featuredNovels[featuredIndex].status && (
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:circle-small" className="text-base" />
                        {featuredNovels[featuredIndex].status}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:flex justify-center gap-1.5">
                    {featuredNovels.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          setFeaturedIndex(idx);
                        }}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-200 border-2 ${
                          idx === featuredIndex 
                            ? 'bg-primary border-black dark:border-white scale-110' 
                            : 'bg-muted-foreground/40 hover:bg-muted-foreground/60 hover:scale-105 border-black dark:border-white'
                        }`}
                        aria-label={`Show featured novel ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {filteredNovels.map((novel, index) => (
            <NovelCard 
              key={novel.id} 
              novel={novel}
              isPriority={index < 7}
              size="small"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NovelListing; 