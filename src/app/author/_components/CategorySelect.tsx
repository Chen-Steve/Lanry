import { useEffect, useState } from 'react';
import { NovelCategory } from '@/types/database';
import { getCategories, addNovelCategories, removeNovelCategory } from '@/services/categoryService';
import { Icon } from '@iconify/react';

interface CategorySelectProps {
  novelId: string;
  initialCategories?: NovelCategory[];
  onCategoriesChange?: (categories: NovelCategory[]) => void;
}

export default function CategorySelect({ 
  novelId, 
  initialCategories = [],
  onCategoriesChange 
}: CategorySelectProps) {
  const [categories, setCategories] = useState<NovelCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<NovelCategory[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = async (category: NovelCategory) => {
    const isSelected = selectedCategories.some(c => c.id === category.id);
    
    if (isSelected) {
      // Remove category
      const success = await removeNovelCategory(novelId, category.id);
      if (success) {
        const newCategories = selectedCategories.filter(c => c.id !== category.id);
        setSelectedCategories(newCategories);
        onCategoriesChange?.(newCategories);
      }
    } else {
      // Add category
      const success = await addNovelCategories(novelId, [category.id]);
      if (success) {
        const newCategories = [...selectedCategories, category];
        setSelectedCategories(newCategories);
        onCategoriesChange?.(newCategories);
      }
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
      <p className="text-xs md:text-sm text-gray-500 mb-3">
        Select categories that best describe your novel. You can select multiple categories.
      </p>
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.some(c => c.id === category.id);
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryToggle(category)}
              className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
              <Icon 
                icon={isSelected ? "mdi:check-circle" : "mdi:plus-circle"} 
                className="w-3.5 h-3.5 md:w-4 md:h-4"
              />
            </button>
          );
        })}
      </div>
      {selectedCategories.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">
          No categories selected yet
        </p>
      )}
    </div>
  );
} 