import { useEffect, useState } from 'react';
import { NovelCategory } from '@/types/database';
import { getCategories } from '@/services/categoryService';
import { Icon } from '@iconify/react';

interface CategoryFilterProps {
  selectedCategories: {
    included: string[];
    excluded: string[];
  };
  onCategoriesChange: (categories: { included: string[]; excluded: string[] }) => void;
  categoryCounts: Record<string, number>;
  className?: string;
}

export default function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
  categoryCounts,
  className = ''
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<NovelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check initially
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCategoryToggle = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase();
    const { included, excluded } = selectedCategories;

    let newIncluded = [...included];
    let newExcluded = [...excluded];

    if (included.includes(normalizedName)) {
      // If it's included, move to excluded
      newIncluded = newIncluded.filter(cat => cat !== normalizedName);
      newExcluded.push(normalizedName);
    } else if (excluded.includes(normalizedName)) {
      // If it's excluded, remove from all (unselected)
      newExcluded = newExcluded.filter(cat => cat !== normalizedName);
    } else {
      // If it's unselected, add to included
      newIncluded.push(normalizedName);
    }

    onCategoriesChange({ included: newIncluded, excluded: newExcluded });
  };

  if (isLoading) {
    return <div className="animate-pulse h-12 bg-muted rounded-lg mb-6 mt-4 sm:mt-0"></div>;
  }

  return (
    <div className={`mt-4 sm:mt-0 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <button
          aria-label="Toggle category filter"
          onClick={() => setIsExpanded(!isExpanded)}
          className="sm:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon 
            icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
            className="w-5 h-5"
          />
        </button>
      </div>
      
      <div className={`grid gap-1.5 transition-all duration-300 ${
        `grid-cols-4 sm:grid-cols-6 md:grid-cols-8`
      }`}>
        {categories
          .slice(0, (!isExpanded && isMobile) ? 5 : categories.length)
          .map((category) => {
            const isIncluded = selectedCategories.included.includes(category.name.toLowerCase());
            const isExcluded = selectedCategories.excluded.includes(category.name.toLowerCase());
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.name)}
                className={`flex items-center justify-between px-1.5 py-0.5 rounded-md text-xs transition-colors ${
                  isIncluded
                    ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-400/30'
                    : isExcluded
                    ? 'bg-red-100 dark:bg-red-400/20 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-400/30'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                <span className="truncate mr-1">{category.name}</span>
                <span className="text-[10px] font-medium flex-shrink-0">
                  {categoryCounts[category.name] || 0}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
} 