'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import type { Novel, Tag } from '@/types/database';
import { NovelStatus } from '@prisma/client';
import { debounce } from 'lodash';

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
  const [isLoading, setIsLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [authorSuggestions, setAuthorSuggestions] = useState<Array<{ username: string; role: string }>>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

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

      if (
        tagDropdownRef.current && 
        !tagDropdownRef.current.contains(event.target as Node) &&
        !tagInputRef.current?.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }

      if (
        categoryDropdownRef.current && 
        !categoryDropdownRef.current.contains(event.target as Node) &&
        !categoryInputRef.current?.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
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

  const handleSearch = async () => {
    setIsLoading(true);
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

  const handleTagSelect = (tag: Tag) => {
    if (!filters.tags.find(t => t.id === tag.id)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setShowTagDropdown(false);
  };

  const handleTagRemove = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId)
    }));
  };

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

  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    const searchTerm = categorySearch.toLowerCase().trim();
    return searchTerm
      ? categories.filter(category => 
          category.name.toLowerCase().includes(searchTerm)
        )
      : categories;
  }, [categorySearch]);

  const handleCategorySelect = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      category: categoryId
    }));
    setShowCategoryDropdown(false);
    setCategorySearch('');
  };

  const handleCategoryRemove = () => {
    setFilters(prev => ({
      ...prev,
      category: undefined
    }));
  };

  return (
    <div className="flex justify-end gap-6">
      {/* Results Section - Middle */}
      <div className="flex-1 max-w-3xl">
        {results.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Found {results.length} {results.length === 1 ? 'novel' : 'novels'}
            </div>
            <div className="space-y-2">
              {results.map((novel) => (
                <Link
                  href={`/novels/${novel.id}`}
                  key={novel.id}
                  className="block p-3 bg-secondary rounded-lg border border-border hover:border-primary hover:bg-secondary/80 transition-colors"
                >
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{novel.title}</h3>
                      <p className="text-sm text-muted-foreground">by {novel.author}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon icon="material-symbols:bookmark" className="w-4 h-4" />
                        {novel.bookmarkCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="material-symbols:star" className="w-4 h-4" />
                        {novel.rating.toFixed(1)}
                      </span>
                    </div>
                    {(novel.tags || [])?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(novel.tags || []).map(tag => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 text-xs bg-accent rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
                Searching...
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-4xl">🔍</div>
                <div>No novels found. Try adjusting your search criteria.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Form - Right Side */}
      <div className="w-80 shrink-0">
        <div className="space-y-4 bg-secondary/50 rounded-lg p-4 border border-border sticky top-4">
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
                <div className="space-y-2">
                  {filters.category && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm">
                        <span>
                          {categories.find(c => c.id === filters.category)?.name}
                        </span>
                        <button
                          onClick={handleCategoryRemove}
                          className="hover:text-primary/80 transition-colors"
                          aria-label="Remove category filter"
                        >
                          <Icon icon="material-symbols:close" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <div className="relative">
                      <input
                        ref={categoryInputRef}
                        type="text"
                        placeholder="Search and select category..."
                        className="w-full pl-8 pr-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                      />
                      <Icon 
                        icon="material-symbols:search" 
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
                      />
                    </div>

                    {showCategoryDropdown && (
                      <div 
                        ref={categoryDropdownRef}
                        className="absolute left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 w-full max-h-[200px] overflow-y-auto"
                      >
                        {filteredCategories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id)}
                            disabled={filters.category === category.id}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                              filters.category === category.id
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
              </div>
            </div>

            {/* Tag Filters */}
            <div className="space-y-3">
              <div className="space-y-2">
                {/* Selected Tags */}
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {filters.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        <span>{tag.name}</span>
                        <button
                          onClick={() => handleTagRemove(tag.id)}
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
                                onClick={() => handleTagSelect(tag)}
                                disabled={filters.tags.some(t => t.id === tag.id)}
                                className={`px-2 py-1.5 text-left text-sm rounded hover:bg-accent transition-colors ${
                                  filters.tags.some(t => t.id === tag.id)
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