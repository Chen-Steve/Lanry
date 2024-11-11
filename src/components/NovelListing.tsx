'use client';

import React, { useState } from 'react';
import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';

const NovelCard = ({ novel }: { novel: Novel }) => (
  <div className="flex flex-row border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 gap-4">
    <div className="w-32 h-40 flex-shrink-0">
      <div className="w-full h-full bg-gray-300 rounded"></div>
    </div>
    <div className="flex-grow overflow-hidden">
      <h3 className="text-lg font-semibold mb-2 truncate">{novel.title}</h3>
      <p className="text-sm text-gray-600 mb-2">by {novel.author}</p>
      <p className="text-sm text-gray-500 line-clamp-3">{novel.description}</p>
    </div>
  </div>
);

const NovelListing = ({ novels }: { novels: Novel[] }) => {
  const [statusFilter, setStatusFilter] = useState('popular');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const filters = ['popular', 'new', 'completed', 'dropped', 'hiatus'];

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Mobile Filter Button */}
      <div className="flex justify-between items-center mb-4 md:hidden">
        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg"
        >
          <Icon icon="mdi:filter-variant" className="text-xl" />
          <span>Filters</span>
        </button>
        <button 
          className="px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center space-x-2"
          onClick={() => setStatusFilter('bookmarked')}
        >
          <Icon icon="mdi:bookmark" className="text-xl" />
          <span className="hidden sm:inline">Bookmarked</span>
        </button>
      </div>

      {/* Mobile Filter Menu */}
      {isFilterMenuOpen && (
        <div className="md:hidden mb-4">
          <div className="grid grid-cols-2 gap-2">
            {filters.map((filter) => (
              <button 
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setIsFilterMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  statusFilter === filter 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {capitalizeFirst(filter)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden md:flex justify-between mb-6">
        <div>
          <button 
            onClick={() => setStatusFilter('bookmarked')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
              statusFilter === 'bookmarked' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <Icon icon="mdi:bookmark" className="text-xl" />
            <span>Bookmarked</span>
          </button>
        </div>
        <div className="flex space-x-2">
          {filters.map((filter) => (
            <button 
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                statusFilter === filter 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {capitalizeFirst(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Novel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {novels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </div>
  );
};

export default NovelListing;
