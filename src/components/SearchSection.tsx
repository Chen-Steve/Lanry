import React from 'react';

const SearchSection = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Search Novels</h2>
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder="Search for novels..."
          className="w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchSection;
