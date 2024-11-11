'use client';

import React, { useState } from 'react';
import { Novel } from '@/types/database';

const NovelCard = ({ novel }: { novel: Novel }) => (
  <div className="flex border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex-shrink-0 mr-4">
      <div className="w-24 h-36 bg-gray-300 rounded"></div>
    </div>
    <div className="flex-grow overflow-hidden">
      <h3 className="text-xl font-semibold mb-2 truncate">{novel.title}</h3>
      <p className="text-sm text-gray-600 mb-2">by {novel.author}</p>
      <p className="text-sm text-gray-500 line-clamp-3">{novel.description}</p>
    </div>
  </div>
);

const NovelListing = ({ novels }: { novels: Novel[] }) => {
  const [popularityFilter, setPopularityFilter] = useState('all');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Popular Novels</h2>
        <div className="flex space-x-2">
          {['week', 'month', 'year', 'all'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setPopularityFilter(filter)}
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                popularityFilter === filter 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {filter === 'all' ? 'All Time' : `1 ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {novels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </div>
  );
};

export default NovelListing;
