'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const Header = () => {
  const [isForumHovered, setIsForumHovered] = useState(false);

  return (
    <header className="w-full">
      <div className="max-w-5xl mx-auto px-4 mt-8 mb-10">
        <div className="bg-white border-b border-black rounded-md px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
            Lanry
          </Link>
          
          {/* Search Section */}
          <div className="flex-1 max-w-md">
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

          <nav>
            <ul className="flex space-x-6">
              <li>
                <span 
                  onMouseEnter={() => setIsForumHovered(true)}
                  onMouseLeave={() => setIsForumHovered(false)}
                  className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer inline-block min-w-[100px]"
                >
                  {isForumHovered ? 'Coming Soon' : 'Forum'}
                </span>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-gray-800 transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
