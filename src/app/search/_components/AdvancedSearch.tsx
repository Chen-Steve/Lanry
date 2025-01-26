'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import type { Novel, Tag } from '@/types/database';
import { NovelStatus } from '@prisma/client';
import { debounce } from 'lodash';
import TagSelector from './TagSelector';
import CategorySelector from './CategorySelector';
import NovelList from './NovelList';

interface SearchFilters {
  query: string;
  author: string;
  tags: Tag[];
  status?: NovelStatus;
  category?: string;
}

export default function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    author: '',
    tags: [],
  });
  const [results, setResults] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [authorSuggestions, setAuthorSuggestions] = useState<Array<{ username: string; role: string }>>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'action', name: 'Action' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'drama', name: 'Drama' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'horror', name: 'Horror' },
    { id: 'mystery', name: 'Mystery' },
    { id: 'romance', name: 'Romance' },
    { id: 'sci-fi', name: 'Sci-Fi' },
    { id: 'slice-of-life', name: 'Slice of Life' },
    { id: 'supernatural', name: 'Supernatural' },
    { id: 'thriller', name: 'Thriller' }
  ];

  // Fetch author suggestions
  const debouncedFetchAuthors = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setAuthorSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/authors?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch authors');
        const data = await response.json();
        setAuthorSuggestions(data);
      } catch (error) {
        console.error('Error fetching authors:', error);
        setAuthorSuggestions([]);
      }
    }, 300)
  ).current;

  // Handle author input change
  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, author: value }));
    setShowAuthorDropdown(true);
    debouncedFetchAuthors(value);
  };

  // Handle author selection
  const handleAuthorSelect = (author: { username: string; role: string }) => {
    setFilters(prev => ({ ...prev, author: author.username }));
    setShowAuthorDropdown(false);
    setAuthorSuggestions([]);
  };

  // Close author dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        authorDropdownRef.current && 
        !authorDropdownRef.current.contains(event.target as Node) &&
        !authorInputRef.current?.contains(event.target as Node)
      ) {
        setShowAuthorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      debouncedFetchAuthors.cancel();
    };
  }, [debouncedFetchAuthors]);

  useEffect(() => {
    // Fetch available tags
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        setAvailableTags(data);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Fetch all novels on initial load
  useEffect(() => {
    const fetchAllNovels = async () => {
      try {
        const response = await fetch('/api/novels');
        if (!response.ok) throw new Error('Failed to fetch novels');
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllNovels();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.query.trim()) {
        queryParams.append('q', filters.query);
      }

      if (filters.author.trim()) {
        queryParams.append('author', filters.author);
      }
      
      filters.tags.forEach(tag => {
        queryParams.append('tags', tag.id);
      });
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      if (filters.category) {
        queryParams.append('category', filters.category);
      }

      const response = await fetch(`/api/novels/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    if (!filters.tags.find(t => t.id === tag.id)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId)
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      category: categoryId
    }));
  };

  const handleCategoryRemove = () => {
    setFilters(prev => ({
      ...prev,
      category: undefined
    }));
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row justify-end gap-4 lg:gap-6">
      {/* Results Section */}
      <div className="flex-1 max-w-3xl w-full">
        <NovelList 
          novels={results} 
          isLoading={isLoading}
          emptyMessage={hasSearched ? "No novels match your search criteria" : "No novels found"}
        />
      </div>

      {/* Search Form */}
      <div className="w-full lg:w-80 lg:shrink-0">
        <div className="space-y-4 bg-secondary/50 rounded-lg p-4 border border-border lg:sticky lg:top-4">
          {/* Filter Types */}
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-1.5">
                <Icon icon="material-symbols:filter-list" className="w-4 h-4" />
                Filters
              </h3>
              <div className="space-y-2">
                {/* Title Search */}
                <div>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={e => setFilters(prev => ({ ...prev, query: e.target.value }))}
                    placeholder="Search by title..."
                    className="w-full px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                {/* Author Search */}
                <div className="relative" ref={authorDropdownRef}>
                  <input
                    ref={authorInputRef}
                    type="text"
                    value={filters.author}
                    onChange={handleAuthorChange}
                    onFocus={() => {
                      if (filters.author.trim()) {
                        setShowAuthorDropdown(true);
                        debouncedFetchAuthors(filters.author);
                      }
                    }}
                    placeholder="Search by author..."
                    className="w-full px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  {showAuthorDropdown && authorSuggestions.length > 0 && (
                    <div className="absolute left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-full">
                      {authorSuggestions.map((author, index) => (
                        <button
                          key={index}
                          onClick={() => handleAuthorSelect(author)}
                          className="w-full px-3 py-1.5 text-left hover:bg-accent transition-colors text-sm flex items-center justify-between"
                        >
                          <span>{author.username}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {author.role.toLowerCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={filters.status || ''}
                  onChange={e => setFilters(prev => ({ 
                    ...prev, 
                    status: e.target.value ? e.target.value as NovelStatus : undefined 
                  }))}
                  className="w-full px-3 py-1.5 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  aria-label="Filter by novel status"
                >
                  <option value="">Any status</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="HIATUS">Hiatus</option>
                </select>

                {/* Category Filter */}
                <CategorySelector
                  categories={categories}
                  selectedCategory={filters.category}
                  onCategorySelect={handleCategorySelect}
                  onCategoryRemove={handleCategoryRemove}
                />
              </div>
            </div>

            {/* Tag Filters */}
            <div className="space-y-3">
              <TagSelector
                availableTags={availableTags}
                selectedTags={filters.tags}
                onTagSelect={handleTagSelect}
                onTagRemove={handleTagRemove}
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                Searching...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Icon icon="material-symbols:search" className="w-4 h-4" />
                Search
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 