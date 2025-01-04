import { useEffect, useState } from 'react';
import { NovelCategory } from '@/types/database';
import { getCategories } from '@/services/categoryService';
import { Icon } from '@iconify/react';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categoryNames: string[]) => void;
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
    const newSelectedCategories = selectedCategories.includes(categoryName.toLowerCase())
      ? selectedCategories.filter(cat => cat !== categoryName.toLowerCase())
      : [...selectedCategories, categoryName.toLowerCase()];
    onCategoriesChange(newSelectedCategories);
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
        `grid-cols-3 sm:grid-cols-4 md:grid-cols-6`
      }`}>
        {categories
          .slice(0, (!isExpanded && isMobile) ? 5 : categories.length)
          .map((category) => {
            const isSelected = selectedCategories.includes(category.name.toLowerCase());
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.name)}
                className={`flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors w-full ${
                  isSelected
                    ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-400/30'
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