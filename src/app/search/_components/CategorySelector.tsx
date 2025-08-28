import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CategorySelectorProps {
  availableCategories: Category[];
  selectedCategories: string[];
  onCategorySelect: (categoryId: string) => void;
  onCategoryRemove: (categoryId: string) => void;
}

export default function CategorySelector({
  availableCategories,
  selectedCategories,
  onCategorySelect,
  onCategoryRemove,
}: CategorySelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>(availableCategories);
  const [isLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync categories when parent provides updates
  useEffect(() => {
    setCategories(availableCategories);
  }, [availableCategories]);

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
      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedCategories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            if (!category) return null;
            
            return (
              <div key={categoryId} className="group flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors">
                <Icon icon="material-symbols:category" className="w-3.5 h-3.5" />
                <span>{category.name}</span>
                <button
                  onClick={() => onCategoryRemove(categoryId)}
                  className="opacity-75 group-hover:opacity-100 hover:text-primary/80 transition-all"
                  aria-label="Remove category filter"
                >
                  <Icon icon="material-symbols:close" className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Search */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search and select categories..."
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
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No categories found
              </div>
            ) : (
              filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategorySelect(category.id);
                    setSearch('');
                  }}
                  disabled={selectedCategories.includes(category.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2
                    ${selectedCategories.includes(category.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  <Icon 
                    icon={selectedCategories.includes(category.id)
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