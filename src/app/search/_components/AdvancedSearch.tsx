'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import type { Novel, Tag } from '@/types/database';
import { debounce } from 'lodash';
import { useSearchParams } from 'next/navigation';
import TagSelector from './TagSelector';
import CategorySelector from './CategorySelector';
import NovelList from './NovelList';

type NovelStatus = 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';

interface SearchFilters {
  query: string;
  author: string;
  tags: Tag[];
  status?: NovelStatus;
  categories: string[];
  page: number;
}

export default function AdvancedSearch() {
  const searchParams = useSearchParams();
  // 1. Use hardcoded defaults for filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    author: '',
    tags: [],
    categories: [],
    page: 1,
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

  // Available novel status options (excluding DRAFT as it is not shown in the UI)
  const STATUS_OPTIONS: NovelStatus[] = ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED'];

  // 2. On mount, set filters from URL (except tags, which are handled in tag loader)
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const author = searchParams.get('author') || '';
    const categories = searchParams.getAll('categories') || [];
    const page = parseInt(searchParams.get('page') || '1');
    setFilters(prev => ({
      ...prev,
      query,
      author,
      categories,
      page,
    }));
    // Tags are handled in the tag loading effect
    // eslint-disable-next-line
  }, []); // Only on mount

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

  // Load tags and initialize filters from URL
  useEffect(() => {
    const initializeFromUrl = async (tags: Tag[]) => {
      const tagIds = searchParams.getAll('tags');
      if (tagIds.length > 0) {
        const selectedTags = tags.filter((tag: Tag) => tagIds.includes(tag.id));
        setFilters(prev => ({ ...prev, tags: selectedTags }));
      }
    };

    const loadTags = async () => {
      try {
        // Try to get cached tags first
        const cachedTags = localStorage.getItem('availableTags');
        const tagsTimestamp = localStorage.getItem('tagsTimestamp');
        const ONE_HOUR = 60 * 60 * 1000;
        
        if (cachedTags && tagsTimestamp && Date.now() - parseInt(tagsTimestamp) <= ONE_HOUR) {
          const tags = JSON.parse(cachedTags);
          setAvailableTags(tags);
          await initializeFromUrl(tags);
          return;
        }

        // If no cache or expired, fetch from API
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const tags = await response.json();
        
        setAvailableTags(tags);
        await initializeFromUrl(tags);

        // Update cache
        try {
          localStorage.setItem('availableTags', JSON.stringify(tags));
          localStorage.setItem('tagsTimestamp', Date.now().toString());
        } catch (error) {
          console.warn('Failed to cache tags:', error);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };

    loadTags();
  }, []); // Only run on mount

  // After tag loading and filter initialization, add:
  useEffect(() => {
    // Only run on first mount
    handleSearch(true, {
      query: '',
      author: '',
      tags: [],
      categories: [],
      page: 1,
      // status: undefined, // if needed by SearchFilters
    });
    // eslint-disable-next-line
  }, []);

  const handleSearch = useCallback(async (resetPage: boolean = false, searchFilters: SearchFilters = filters) => {
    const newPage = resetPage ? 1 : searchFilters.page;
    
    if (resetPage) {
      setFilters(prev => ({ ...prev, page: 1 }));
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (searchFilters.query.trim()) {
        queryParams.append('q', searchFilters.query);
      }

      if (searchFilters.author.trim()) {
        queryParams.append('author', searchFilters.author);
      }
      
      if (searchFilters.tags.length > 0) {
        searchFilters.tags.forEach(tag => {
          queryParams.append('tags', tag.id);
        });
      }
      
      if (searchFilters.status) {
        queryParams.append('status', searchFilters.status);
      }

      if (searchFilters.categories.length > 0) {
        searchFilters.categories.forEach(category => {
          queryParams.append('categories', category);
        });
      }

      queryParams.append('page', newPage.toString());

      // Update the URL only when a search is performed
      const newSearch = queryParams.toString();
      const currentPath = window.location.pathname;
      const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;
      window.history.replaceState({}, '', newUrl);

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
  }, [filters]);  // Remove filters dependency

  // Effect to trigger search when filters change
  // This effect is removed as per the edit hint.

  // Update URL when filters change
  // This effect is removed as per the edit hint.

  const handlePageChange = (newPage: number) => {
    // Update the page in filters and immediately trigger a search
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    handleSearch(false, newFilters);
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
      categories: [...prev.categories, categoryId]
    }));
  };

  const handleCategoryRemove = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.filter(id => id !== categoryId)
    }));
  };

  // Function to check if any filters are active
  const hasActiveFilters = () => {
    return filters.query.trim() !== '' ||
           filters.author.trim() !== '' ||
           filters.tags.length > 0 ||
           filters.status !== undefined ||
           filters.categories.length > 0;
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
                {/* Title and Author Search */}
                <div className="flex gap-2">
                  {/* Title Search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={filters.query}
                      onChange={e => setFilters(prev => ({ ...prev, query: e.target.value }))}
                      placeholder="Search by title..."
                      className="w-full px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Author Search */}
                  <div className="flex-1">
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
                </div>

                {/* Status Filter - button selections */}
                <div className="flex flex-wrap gap-2" aria-label="Filter by novel status">
                  {/* "Any" option */}
                  <button
                    type="button"
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        status: undefined,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors ${
                      !filters.status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground'
                    }`}
                  >
                    Any
                  </button>

                  {STATUS_OPTIONS.map(statusOption => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          // Toggle if the same status is clicked again
                          status: prev.status === statusOption ? undefined : statusOption,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg border capitalize hover:bg-accent transition-colors ${
                        filters.status === statusOption
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground'
                      }`}
                    >
                      {statusOption.toLowerCase()}
                    </button>
                  ))}
                </div>
                {/* Category Filter */}
                <div>
                  <CategorySelector
                    selectedCategories={filters.categories}
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
                        categories: [],
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