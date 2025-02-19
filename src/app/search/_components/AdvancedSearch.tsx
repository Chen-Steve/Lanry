'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  page: number;
}

export default function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    author: '',
    tags: [],
    page: 1
  });
  const [results, setResults] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [authorSuggestions, setAuthorSuggestions] = useState<Array<{ username: string; role: string }>>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);

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
    // Cache tags in localStorage
    const cachedTags = localStorage.getItem('availableTags');
    if (cachedTags) {
      setAvailableTags(JSON.parse(cachedTags));
    }

    // Fetch available tags if not cached or expired
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        setAvailableTags(data);
        localStorage.setItem('availableTags', JSON.stringify(data));
        localStorage.setItem('tagsTimestamp', Date.now().toString());
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    const tagsTimestamp = localStorage.getItem('tagsTimestamp');
    const ONE_HOUR = 60 * 60 * 1000;
    if (!tagsTimestamp || Date.now() - parseInt(tagsTimestamp) > ONE_HOUR) {
      fetchTags();
    }
  }, []);

  const handleSearch = useCallback(async (resetPage: boolean = false) => {
    const newPage = resetPage ? 1 : filters.page;
    
    if (resetPage) {
      setFilters(prev => ({ ...prev, page: 1 }));
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const queryParams = new URLSearchParams();
      
      // Only add search parameters if they exist
      if (filters.query.trim()) {
        queryParams.append('q', filters.query);
      }

      if (filters.author.trim()) {
        queryParams.append('author', filters.author);
      }
      
      if (filters.tags.length > 0) {
        filters.tags.forEach(tag => {
          queryParams.append('tags', tag.id);
        });
      }
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      if (filters.category) {
        queryParams.append('category', filters.category);
      }

      queryParams.append('page', newPage.toString());

      const response = await fetch(`/api/novels/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      
      setResults(data.novels);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    handleSearch(true);
  }, [handleSearch]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    handleSearch(false);
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

  // Function to check if any filters are active
  const hasActiveFilters = () => {
    return filters.query.trim() !== '' ||
           filters.author.trim() !== '' ||
           filters.tags.length > 0 ||
           filters.status !== undefined ||
           filters.category !== undefined;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Filter Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Icon icon="material-symbols:filter-list" className="w-5 h-5" />
            <span className="flex items-center gap-2">
              Filters
              {hasActiveFilters() && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </span>
            <Icon 
              icon={showFilters ? "material-symbols:expand-less" : "material-symbols:expand-more"} 
              className="w-5 h-5" 
            />
          </button>
        </div>

        {/* Filter Form */}
        {showFilters && (
          <div className="w-full bg-secondary/50 rounded-lg p-4 border border-border">
            <div className="space-y-4">
              {/* Basic Filters */}
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
                <div>
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
                </div>

                {/* Status Filter */}
                <div>
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
                </div>

                {/* Category Filter */}
                <div>
                  <CategorySelector
                    selectedCategory={filters.category}
                    onCategorySelect={handleCategorySelect}
                    onCategoryRemove={handleCategoryRemove}
                  />
                </div>

                {/* Tag Filters */}
                <div>
                  <TagSelector
                    availableTags={availableTags}
                    selectedTags={filters.tags}
                    onTagSelect={handleTagSelect}
                    onTagRemove={handleTagRemove}
                  />
                </div>
              </div>

              {/* Search and Clear Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleSearch(true);
                    setShowFilters(false);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Icon icon="eos-icons:loading" className="w-5 h-5 mx-auto animate-spin" />
                  ) : (
                    'Apply Filters'
                  )}
                </button>
                {hasActiveFilters() && (
                  <button
                    onClick={() => {
                      setFilters({
                        query: '',
                        author: '',
                        tags: [],
                        page: 1
                      });
                      handleSearch(true);
                      setShowFilters(false);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="w-full">
          <NovelList 
            novels={results} 
            isLoading={isLoading}
            emptyMessage={hasSearched && results.length === 0 ? "No novels match your search criteria" : "Loading novels..."}
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
} 