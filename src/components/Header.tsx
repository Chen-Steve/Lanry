'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { supabase } from '@/lib/supabase';

const Header = () => {
  const [isForumHovered, setIsForumHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(event === 'SIGNED_IN');
      if (session?.user) {
        // Fetch the profile to get the username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        setUsername(profile?.username || 'User'); // Provide a fallback value
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session?.user) {
      // Fetch the profile to get the username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
      
      setUsername(profile?.username || 'User'); // Provide a fallback value
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsProfileDropdownOpen(false);
  };

  const renderAuthLink = () => {
    if (isAuthenticated) {
      return (
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Profile
          </button>
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <Link
                href="/user-dashboard"
                className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
              >
                {username}
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      );
    }
    return (
      <Link href="/auth" className="text-gray-600 hover:text-gray-800 transition-colors">
        Sign In
      </Link>
    );
  };

  return (
    <header className="w-full">
      <div className="max-w-5xl mx-auto px-4 mt-4 sm:mt-8 mb-6 sm:mb-10">
        <div className="bg-white border-b border-black rounded-md px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
              Lanry
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 md:hidden"
              aria-label="Toggle menu"
            >
              <Icon 
                icon={isMenuOpen ? "mdi:close" : "mdi:menu"} 
                className="text-2xl text-gray-600"
              />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
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
                  <Link href="/sponsors" className="text-gray-600 hover:text-gray-800 transition-colors">
                    Sponsors
                  </Link>
                </li>
                <li>
                  {renderAuthLink()}
                </li>
              </ul>
            </nav>
          </div>

          {/* Search Bar - Full Width on Mobile */}
          <div className="mt-4 mb-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Search for novels..."
                className="w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                aria-label="Search" 
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Icon icon="mdi:magnify" className="text-xl" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden border-t border-gray-200 mt-2">
              <ul className="py-2 space-y-2">
                <li>
                  <span 
                    className="block px-2 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Forum (Coming Soon)
                  </span>
                </li>
                <li>
                  <Link 
                    href="/sponsors" 
                    className="block px-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sponsors
                  </Link>
                </li>
                <li>
                  {isAuthenticated ? (
                    <div>
                      <button 
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="block w-full text-left px-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Profile
                      </button>
                      {isProfileDropdownOpen && (
                        <div className="bg-gray-50 py-1">
                          <Link
                            href="/user-dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {username}
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link 
                      href="/auth" 
                      className="block px-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
