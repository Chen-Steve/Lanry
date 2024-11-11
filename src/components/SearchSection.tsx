import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import type { Novel } from '@/types/database';

interface SearchSectionProps {
  onSearch: (query: string, results: Novel[]) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Novel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/novels/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data);
        setShowDropdown(true);
        onSearch(query, data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300)
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
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        placeholder="Search for novels..."
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {showDropdown && (
        <div className="absolute w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
          {isLoading ? (
            <div className="px-4 py-2 text-center text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((novel) => (
              <Link 
                href={`/novels/${novel.id}`} 
                key={novel.id}
                className="block px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer border-b last:border-b-0"
                onClick={() => setShowDropdown(false)}
              >
                <span className="text-gray-900">{novel.title}</span>
                <span className="text-gray-500 text-sm ml-2">by {novel.author}</span>
              </Link>
            ))
          ) : (
            <div className="px-4 py-2 text-center text-gray-500">
              {searchQuery.trim() ? 'No novels found' : 'Start typing to search'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSection;
