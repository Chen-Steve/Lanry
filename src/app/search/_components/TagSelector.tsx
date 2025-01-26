import React, { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import type { Tag } from '@/types/database';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  onTagRemove: (tagId: string) => void;
}

export default function TagSelector({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
}: TagSelectorProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Group tags by first letter for better organization
  const tagCategories = React.useMemo(() => {
    const categories: Record<string, Tag[]> = {
      'All': availableTags,
    };

    // Group remaining tags by first letter
    availableTags.forEach(tag => {
      const firstLetter = tag.name.charAt(0).toUpperCase();
      if (!categories[firstLetter]) {
        categories[firstLetter] = [];
      }
      categories[firstLetter].push(tag);
    });

    // Sort categories by name
    return Object.fromEntries(
      Object.entries(categories)
        .sort(([a], [b]) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b))
    );
  }, [availableTags]);

  // Filter tags based on search and selected category
  const filteredTags = React.useMemo(() => {
    const searchTerm = tagSearch.toLowerCase().trim();
    const categoryTags = selectedCategory === 'All' 
      ? availableTags 
      : tagCategories[selectedCategory] || [];

    return searchTerm
      ? categoryTags.filter(tag => 
          tag.name.toLowerCase().includes(searchTerm)
        )
      : categoryTags;
  }, [tagSearch, selectedCategory, availableTags, tagCategories]);

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm"
            >
              <span>{tag.name}</span>
              <button
                onClick={() => onTagRemove(tag.id)}
                className="hover:text-primary/80 transition-colors"
                aria-label={`Remove ${tag.name} tag`}
              >
                <Icon icon="material-symbols:close" className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tag Search */}
      <div className="relative">
        <div className="relative">
          <input
            ref={tagInputRef}
            type="text"
            placeholder="Search and select tags..."
            className="w-full pl-8 pr-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            onFocus={() => setShowTagDropdown(true)}
          />
          <Icon 
            icon="material-symbols:search" 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
          />
        </div>

        {showTagDropdown && (
          <div ref={tagDropdownRef} className="absolute left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 w-full">
            <div className="flex divide-x divide-border max-h-[300px]">
              {/* Category List */}
              <div className="w-1/3 overflow-y-auto border-r border-border">
                {Object.keys(tagCategories).map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                      selectedCategory === category ? 'bg-accent/50 font-medium' : ''
                    }`}
                  >
                    {category}
                    <span className="ml-1 text-muted-foreground">
                      ({tagCategories[category].length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Tags in Category */}
              <div className="w-2/3 overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-1">
                  {filteredTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onTagSelect(tag)}
                      disabled={selectedTags.some(t => t.id === tag.id)}
                      className={`px-2 py-1.5 text-left text-sm rounded hover:bg-accent transition-colors ${
                        selectedTags.some(t => t.id === tag.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 