import React, { useRef, useState, useEffect } from 'react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get popular tags (top 5 by usage count if available)
  const popularTags = React.useMemo(() => {
    return availableTags
      .slice()
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
  }, [availableTags]);

  // Filter and group tags based on search
  const filteredTags = React.useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return availableTags;
    
    return availableTags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm)
    );
  }, [search, availableTags]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < filteredTags.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < filteredTags.length) {
          e.preventDefault();
          const selectedTag = filteredTags[activeIndex];
          if (!selectedTags.find(t => t.id === selectedTag.id)) {
            onTagSelect(selectedTag);
          }
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

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

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
            >
              <Icon icon="material-symbols:tag" className="w-3.5 h-3.5" />
              <span>{tag.name}</span>
              <button
                onClick={() => onTagRemove(tag.id)}
                className="opacity-75 group-hover:opacity-100 hover:text-primary/80 transition-all"
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
            ref={inputRef}
            type="text"
            placeholder="Search and select tags..."
            className="w-full pl-8 pr-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
          />
          <Icon 
            icon="material-symbols:search" 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
          />
        </div>

        {showDropdown && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 w-full max-h-[350px] overflow-y-auto"
          >
            {/* Popular Tags Section */}
            {!search && popularTags.length > 0 && (
              <div className="p-2 border-b border-border">
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <Icon icon="material-symbols:trending-up" className="w-4 h-4" />
                  Popular Tags
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {popularTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (!selectedTags.find(t => t.id === tag.id)) {
                          onTagSelect(tag);
                        }
                      }}
                      disabled={selectedTags.some(t => t.id === tag.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 text-sm rounded-full border border-border
                        ${selectedTags.some(t => t.id === tag.id)
                          ? 'opacity-50 cursor-not-allowed bg-accent/50'
                          : 'hover:bg-accent hover:border-accent-foreground/20 transition-colors'
                        }`}
                    >
                      <span>{tag.name}</span>
                      {tag.usageCount && (
                        <span className="text-xs text-muted-foreground">
                          ({tag.usageCount})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Tags */}
            <div className="p-1">
              {filteredTags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  No tags found
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {filteredTags.map((tag, index) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (!selectedTags.find(t => t.id === tag.id)) {
                          onTagSelect(tag);
                        }
                      }}
                      disabled={selectedTags.some(t => t.id === tag.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-left
                        ${activeIndex === index ? 'bg-accent' : ''}
                        ${selectedTags.some(t => t.id === tag.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-accent transition-colors'
                        }`}
                    >
                      <Icon 
                        icon={selectedTags.some(t => t.id === tag.id) 
                          ? "material-symbols:check-circle" 
                          : "material-symbols:radio-button-unchecked"
                        } 
                        className="w-4 h-4 text-primary/75" 
                      />
                      <span className="flex-1">{tag.name}</span>
                      {tag.usageCount && (
                        <span className="text-xs text-muted-foreground">
                          {tag.usageCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 