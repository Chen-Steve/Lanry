'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import SearchSection from './SearchSection';
import type { Novel } from '@/types/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query for user profile including streak data
  const { data: userProfile } = useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, current_streak, last_visit, coins')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Mutation for updating streak
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID');

      const today = new Date();
      const lastVisit = userProfile?.last_visit ? new Date(userProfile.last_visit) : null;
      
      let newStreak = 1; // Default for first visit or broken streak
      
      if (lastVisit) {
        // Reset hours/minutes/seconds to compare calendar days only
        const lastVisitDay = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = todayDay.getTime() - lastVisitDay.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 0) {
          return null; // Same calendar day, no update needed
        } else if (diffDays === 1) {
          // Consecutive calendar day
          newStreak = (userProfile?.current_streak || 0) + 1;
        }
        // If diffDays > 1, streak resets to 1 (unchanged)
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          last_visit: today.toISOString(),
          updated_at: today.toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['profile', userId], data);
      }
    },
    onError: (error) => {
      console.error('Error updating streak:', error);
    }
  });

  // Update streak when component mounts and user is authenticated
  useEffect(() => {
    if (userId && userProfile) {
      updateStreakMutation.mutate();
    }
  }, [userId, userProfile, updateStreakMutation]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('[Init] Error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setIsAuthenticated(false);
      } else if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
      }
      setIsLoading(false);
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
        // Clear ALL Supabase-related items from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear states
      setIsAuthenticated(false);
      setUserId(null);
      setIsProfileDropdownOpen(false);
      setIsMenuOpen(false);

      // Clear React Query cache
      queryClient.clear();

      // Force a hard refresh but with a small delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      // Force cleanup anyway
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
      queryClient.clear();
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
            {userProfile?.username || 'Error loading profile'}
          </button>
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <Link
                href="/user-dashboard"
                className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
              >
                {userProfile?.username || 'Error loading profile'}
              </Link>
              <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 flex items-center gap-2">
                <Icon icon="mdi:fire" className={`${userProfile?.current_streak ? 'text-orange-500' : 'text-gray-400'}`} />
                <span>
                  {userProfile?.current_streak || 0} day
                  {(userProfile?.current_streak || 0) !== 1 ? 's' : ''} streak
                </span>
              </div>
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

  const handleForumClick = () => {
    const toastId = toast('Forum coming soon!', {
      icon: '🚧',
      duration: 2000,
      className: 'font-medium border-2 border-black',
      position: 'top-right'
    });
    
    // Force dismiss after 2.5 seconds
    setTimeout(() => {
      toast.dismiss(toastId);
    }, 2500);
  };

  return (
    <header className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-4 mt-4 sm:mt-8 mb-2 sm:mb-10">
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
              <ul className="flex items-center space-x-6">
                <li>
                  <span 
                    onClick={handleForumClick}
                    className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer py-1.5 inline-block"
                  >
                    Forum
                  </span>
                </li>
                <li>
                  <Link href="/sponsors" className="text-gray-600 hover:text-gray-800 transition-colors py-1.5 inline-block">
                    Sponsors
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/shop" 
                    className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md hover:bg-amber-200 transition-colors flex items-center gap-2 h-[34px]"
                  >
                    <Icon icon="ph:coins" className="text-amber-600" />
                    <span>Coins</span>
                    {userProfile && (
                      <span className="rounded-md text-sm">
                        {userProfile.coins || 0}
                      </span>
                    )}
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
                    onClick={handleForumClick}
                    className="block px-2 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Forum
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
                  <Link 
                    href="/shop" 
                    className="block px-2 py-2 text-gray-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors px-3 py-1.5 rounded-md">
                      <Icon icon="ph:coins" className="text-amber-600" />
                      <span>Coins</span>
                      {userProfile && (
                        <span className="rounded-md text-sm">
                          {userProfile.coins || 0}
                        </span>
                      )}
                    </span>
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
                            {userProfile?.username}
                          </Link>
                          <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 flex items-center gap-2">
                            <Icon icon="mdi:fire" className={`${userProfile?.current_streak ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span>
                              {userProfile?.current_streak || 0} day
                              {(userProfile?.current_streak || 0) !== 1 ? 's' : ''} streak
                            </span>
                          </div>
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