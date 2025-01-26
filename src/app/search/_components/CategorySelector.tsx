import React, { useRef, useState } from 'react';
import { Icon } from '@iconify/react';

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onCategoryRemove: () => void;
}

export default function CategorySelector({
  categories,
  selectedCategory,
  onCategorySelect,
  onCategoryRemove,
}: CategorySelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    return searchTerm
      ? categories.filter(category => 
          category.name.toLowerCase().includes(searchTerm)
        )
      : categories;
  }, [search, categories]);

  return (
    <div className="space-y-2">
      {/* Selected Category */}
      {selectedCategory && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm">
            <span>
              {categories.find(c => c.id === selectedCategory)?.name}
            </span>
            <button
              onClick={onCategoryRemove}
              className="hover:text-primary/80 transition-colors"
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
          />
          <Icon 
            icon="material-symbols:search" 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
          />
        </div>

        {showDropdown && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 w-full max-h-[200px] overflow-y-auto"
          >
            {filteredCategories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  onCategorySelect(category.id);
                  setShowDropdown(false);
                  setSearch('');
                }}
                disabled={selectedCategory === category.id}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                  selectedCategory === category.id
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 