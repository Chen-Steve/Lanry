'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import SearchSection from './SearchSection';
import type { Novel } from '@/types/database';

const Header = () => {
  const [isForumHovered, setIsForumHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('[Profile] Fetching profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[Profile] Database Error:', error);
        setUsername('User');
        return;
      }
      
      if (!profile?.username) {
        console.log('[Profile] No username found, creating default profile');
        // Try to create a default profile if one doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              username: 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
          .single();

        if (insertError) {
          console.error('[Profile] Failed to create default profile:', insertError);
        }
        
        setUsername('User');
        return;
      }
      
      console.log('[Profile] Username found:', profile.username);
      setUsername(profile.username);
    } catch (err) {
      console.error('[Profile] Unexpected error:', err);
      setUsername('User');
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initAuth = async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Init] Session Error:', sessionError);
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('[Init] Session found:', session.user.id);
          setIsAuthenticated(true);
          
          // Add retry logic for profile fetch
          const fetchProfileWithRetry = async () => {
            try {
              await fetchUserProfile(session.user.id);
            } catch (error) {
              console.error(`[Init] Profile fetch attempt ${retryCount + 1} failed:`, error);
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(fetchProfileWithRetry, 1000 * retryCount); // Exponential backoff
              }
            }
          };
          
          await fetchProfileWithRetry();
        } else {
          console.log('[Init] No session');
          setIsAuthenticated(false);
          setUsername(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('[Init] Error:', error);
        setIsLoading(false);
      }
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth Event]', event, session?.user?.id);
      
      if (!mounted) return;

      try {
        if (session?.user) {
          setIsAuthenticated(true);
          await fetchUserProfile(session.user.id);
        } else {
          setIsAuthenticated(false);
          setUsername(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('[Auth Event] Error:', error);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target as Node) &&
        isProfileDropdownOpen
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  const handleSignOut = async () => {
    console.log('Sign out initiated');
    try {
      // First, clear any stored session data
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase.auth.token');
        window.localStorage.removeItem('supabase.auth.refreshToken');
      }

      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );

      const result = await Promise.race([signOutPromise, timeoutPromise]);
      
      console.log('Sign out API call completed');
      
      if ('error' in result && result.error) {
        console.error('Error signing out:', result.error);
        return;
      }

      // Clear states
      setIsAuthenticated(false);
      setUsername(null);
      setIsProfileDropdownOpen(false);
      setIsMenuOpen(false);

      // Force a hard refresh to clear any remaining state
      window.location.href = '/';
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      // Force sign out on client side if server call fails
      if (typeof window !== 'undefined') {
        window.localStorage.clear(); // More aggressive clearing
      }
      window.location.href = '/';
    }
  };

  const renderAuthLink = () => {
    if (isLoading) {
      return (
        <div className="text-gray-400">
          <Icon icon="eos-icons:loading" className="animate-spin" />
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            {username || 'Loading...'}
          </button>
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <Link
                href="/user-dashboard"
                className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
              >
                {username || 'Loading...'}
              </Link>
              <button
                type="button"
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

  const handleSearchResults = (query: string, results: Novel[]) => {
    // Handle search results here if needed
    console.log('Search results:', results);
  };

  return (
    <header className="w-full">
      <div className="max-w-5xl mx-auto px-4 mt-4 sm:mt-8 mb-6 sm:mb-10">
        <div className="bg-white border-b border-black rounded-md px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between space-x-4">
            {/* Logo */}
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
              Lanry
            </Link>

            {/* Search Section */}
            <div className="hidden md:block">
              <SearchSection onSearch={handleSearchResults} />
            </div>

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

          {/* Move search to mobile menu */}
          {isMenuOpen && (
            <nav className="md:hidden border-t border-gray-200 mt-2">
              <div className="py-2">
                <SearchSection onSearch={handleSearchResults} />
              </div>
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
                            type="button"
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
