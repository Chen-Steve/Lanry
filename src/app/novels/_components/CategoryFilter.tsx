import { useEffect, useState } from 'react';
import { NovelCategory } from '@/types/database';
import { getCategories } from '@/services/categoryService';
import { Icon } from '@iconify/react';

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (categoryName: string | undefined) => void;
  categoryCounts: Record<string, number>;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categoryCounts
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<NovelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-12 bg-gray-200 rounded-lg mb-6"></div>;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <button
          aria-label="Toggle category filter"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Icon 
            icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
            className="w-6 h-6"
          />
        </button>
      </div>
      
      <div className={`grid gap-2 transition-all duration-300 ${
        isExpanded ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
      }`}>
        <button
          onClick={() => onCategoryChange(undefined)}
          className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
            !selectedCategory
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>All Novels</span>
          <span className="text-xs font-medium">
            {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
          </span>
        </button>
        
        {categories
          .slice(0, isExpanded ? categories.length : 5)
          .map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.name)}
              className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                selectedCategory === category.name
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs font-medium">
                {categoryCounts[category.name] || 0}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
} 