import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getCategories } from '@/app/author/_services/categoryService';

interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CategorySelectorProps {
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onCategoryRemove: () => void;
}

export default function CategorySelector({
  selectedCategory,
  onCategorySelect,
  onCategoryRemove,
}: CategorySelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // Map NovelCategory to Category interface
        const mappedCategories = data.map(category => ({
          id: category.id,
          name: category.name,
          createdAt: new Date(category.created_at),
          updatedAt: new Date(category.updated_at)
        }));
        setCategories(mappedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    return searchTerm
      ? categories.filter(category => 
          category.name.toLowerCase().includes(searchTerm)
        )
      : categories;
  }, [search, categories]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected Category */}
      {selectedCategory && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          <div className="group flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors">
            <Icon icon="material-symbols:category" className="w-3.5 h-3.5" />
            <span>
              {categories.find(c => c.id === selectedCategory)?.name}
            </span>
            <button
              onClick={onCategoryRemove}
              className="opacity-75 group-hover:opacity-100 hover:text-primary/80 transition-all"
              aria-label="Remove category filter"
            >
              <Icon icon="material-symbols:close" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Category Search */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search and select category..."
            className="w-full pl-8 pr-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Icon 
            icon={isLoading ? "eos-icons:loading" : "material-symbols:search"}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
          />
        </div>

        {showDropdown && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 w-full max-h-[200px] overflow-y-auto"
          >
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                Loading categories...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No categories found
              </div>
            ) : (
              filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategorySelect(category.id);
                    setShowDropdown(false);
                    setSearch('');
                  }}
                  disabled={selectedCategory === category.id}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2
                    ${selectedCategory === category.id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  <Icon 
                    icon={selectedCategory === category.id 
                      ? "material-symbols:check-circle" 
                      : "material-symbols:radio-button-unchecked"
                    } 
                    className="w-4 h-4 text-primary/75" 
                  />
                  <span>{category.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 