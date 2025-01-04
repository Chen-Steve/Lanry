import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import type { Novel } from '@/types/database';
import { Icon } from '@iconify/react';

interface SearchSectionProps {
  onSearch?: (query: string, results: Novel[]) => void;
  minSearchLength?: number;
}

const SearchSection: React.FC<SearchSectionProps> = ({ 
  onSearch = () => {}, 
  minSearchLength = 2 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Novel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < minSearchLength) {
        setResults([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }

      try {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        setIsLoading(true);

        const response = await fetch(
          `/api/novels/search?q=${encodeURIComponent(query)}`,
          { signal: abortControllerRef.current.signal }
        );
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data);
        setShowDropdown(true);
        onSearch(query, data);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200)
  ).current;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value === '') {
      setResults([]);
      setShowDropdown(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      debouncedSearch(value);
    }
  };

  return (
    <div className="relative w-72" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search for novels..."
          className="w-full pl-10 pr-4 py-2 bg-secondary text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icon icon="material-symbols:search" className="w-5 h-5" />
        </div>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon icon="eos-icons:loading" className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute w-full bg-background mt-1 rounded-lg shadow-lg border border-border max-h-60 overflow-y-auto z-50">
          {isLoading ? (
            <div className="px-4 py-2 text-center text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((novel) => (
              <Link 
                href={`/novels/${novel.id}`} 
                key={novel.id}
                className="block px-4 py-2 hover:bg-accent transition-colors cursor-pointer border-b border-border last:border-b-0"
                onClick={() => setShowDropdown(false)}
              >
                <span className="text-foreground">{novel.title}</span>
                <span className="text-muted-foreground text-sm ml-2">by {novel.author}</span>
              </Link>
            ))
          ) : (
            <div className="px-4 py-2 text-center text-muted-foreground">
              {searchQuery.length < minSearchLength 
                ? `Type at least ${minSearchLength} characters to search` 
                : searchQuery.trim() 
                  ? 'No novels found' 
                  : 'Start typing to search'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSection;
