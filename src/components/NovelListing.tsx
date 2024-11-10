'use client';

import React, { useState } from 'react';

// This is a placeholder for the novel data. In a real application, 
// this would come from an API or database.
const dummyNovels = [
  { 
    id: 1, 
    title: 'The Rising of the Shield Hero', 
    author: 'Aneko Yusagi',
    description: 'Naofumi Iwatani, an uncharismatic otaku who spends his days on games and manga, suddenly finds himself summoned to a parallel universe!'
  },
  { 
    id: 2, 
    title: 'Overlord', 
    author: 'Kugane Maruyama',
    description: 'After announcing it will be discontinuing all service, the internet game "Yggdrasil" shut downs. That was the plan, but for some reason, the player character did not log out some time after the server was closed.'
  },
  { 
    id: 3, 
    title: 'Re:Zero − Starting Life in Another World', 
    author: 'Tappei Nagatsuki',
    description: 'Subaru Natsuki was just trying to get to the convenience store but wound up summoned to another world. He encounters the usual things--life-threatening situations, silver haired beauties, cat fairies--you know, normal stuff.'
  },
  // Add more dummy data as needed
];

const NovelListing = () => {
  const [popularityFilter, setPopularityFilter] = useState('all');

  return (
    <div className="max-w-5xl mx-auto px-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Popular Novels</h2>
        <div className="flex space-x-2">
          {['week', 'month', 'year', 'all'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setPopularityFilter(filter)}
              className={`px-2 py-1 text-sm rounded ${popularityFilter === filter ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {filter === 'all' ? 'All Time' : `1 ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
            </button>
          ))}
        </div>
      </div>
      <div>
        {dummyNovels.map((novel) => (
          <div key={novel.id} className="flex border p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex-shrink-0 mr-3">
              <div className="w-16 h-24 bg-gray-300 rounded"></div>
            </div>
            <div className="flex-grow overflow-hidden">
              <h3 className="text-lg font-semibold mb-1 truncate">{novel.title}</h3>
              <p className="text-sm text-gray-600 mb-1">by {novel.author}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{novel.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NovelListing;
