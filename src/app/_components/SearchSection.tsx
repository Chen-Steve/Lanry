import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import type { Novel } from '@/types/database';
import { Icon } from '@iconify/react';

interface SearchSectionProps {
  onSearch?: (query: string, results: Novel[]) => void;
  minSearchLength?: number;
  onExpandChange?: (expanded: boolean) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ 
  onSearch = () => {}, 
  minSearchLength = 2,
  onExpandChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Novel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < minSearchLength) {
        setResults([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }

      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsLoading(true);

        const response = await fetch(
          `/api/novels/search?q=${encodeURIComponent(query)}&basic=true`,
          { signal: abortControllerRef.current.signal }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Search failed:', errorData);
          throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        
        if (!Array.isArray(data.novels)) {
          throw new Error('Invalid response format');
        }
        
        setResults(data.novels);
        setShowDropdown(true);
        onSearch(query, data.novels);
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
        setIsFocused(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      debouncedSearch.cancel();
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [debouncedSearch]);

  const handleBlur = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      if (!searchQuery) {
        setIsExpanded(false);
      }
    }, 300);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    debouncedSearch(value);
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  };

  return (
    <div 
      className={`relative transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-full sm:w-[24rem]' : 'w-10 sm:w-[24rem]'
      }`} 
      ref={dropdownRef}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search for novels..."
          className={`
            w-full pl-11 pr-10 py-2 
            bg-secondary text-foreground placeholder:text-muted-foreground 
            border border-border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary 
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'opacity-100' : 'sm:opacity-100 opacity-0'}
          `}
        />
        <button 
          onClick={handleSearchClick}
          aria-label="Search novels"
          className={`
            absolute left-2 top-1/2 -translate-y-1/2 
            text-muted-foreground hover:text-foreground 
            transition-all duration-300 ease-in-out
            ${isExpanded 
              ? 'pointer-events-none' 
              : 'sm:pointer-events-none bg-secondary hover:bg-secondary/80 p-2 rounded-lg'
            }
          `}
        >
          <Icon icon="ph:magnifying-glass-bold" className="w-5 h-5" />
        </button>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon icon="eos-icons:loading" className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 sm:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close search"
          >
            <Icon icon="ph:x-bold" className="w-5 h-5" />
          </button>
        )}
      </div>

      {(showDropdown || (isFocused && !searchQuery)) && (
        <div className="absolute w-full bg-background mt-1 rounded-lg shadow-lg border border-border max-h-60 overflow-y-auto z-50">
          {isLoading ? (
            <div className="px-4 py-2 text-center text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((novel) => (
                <Link 
                  href={`/novels/${novel.slug}`} 
                  key={novel.id}
                  className="block px-4 py-2 hover:bg-accent transition-colors cursor-pointer border-b border-border last:border-b-0"
                  onClick={() => {
                    setShowDropdown(false);
                    setIsExpanded(false);
                  }}
                >
                  <span className="text-foreground">{novel.title}</span>
                  {novel.author && (
                    <span className="text-muted-foreground text-sm ml-2">by {novel.author}</span>
                  )}
                </Link>
              ))}
              <Link
                href="/search"
                className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors text-center border-t border-border"
                onClick={() => setIsExpanded(false)}
              >
                Advanced Search
              </Link>
            </>
          ) : searchQuery.length > 0 ? (
            <div className="space-y-2 p-4">
              <div className="text-center text-muted-foreground">
                {searchQuery.length < minSearchLength 
                  ? `Type at least ${minSearchLength} characters to search` 
                  : searchQuery.trim() 
                    ? 'No novels found' 
                    : 'Start typing to search'}
              </div>
              <Link
                href="/search"
                className="block text-sm text-primary hover:text-primary/80 transition-colors text-center"
                onClick={() => setIsExpanded(false)}
              >
                Try Advanced Search
              </Link>
            </div>
          ) : (
            <div className="p-2 text-center">
              <Link
                href="/search"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
                onClick={() => setIsExpanded(false)}
              >
                Advanced Search
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSection;