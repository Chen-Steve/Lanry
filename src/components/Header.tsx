'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import SearchSection from './SearchSection';
import type { Novel } from '@/types/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSupabase } from './Providers';

const Header = () => {
  const { supabase, user } = useSupabase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const hasUpdatedStreak = useRef(false);

  // Mutation for updating streak
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const today = new Date().toISOString().split('T')[0];
      
      // First get current profile data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('current_streak, last_visit')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Calculate if streak should be incremented or reset
      const lastVisit = profile?.last_visit ? new Date(profile.last_visit) : null;
      const currentStreak = profile?.current_streak || 0;
      
      let newStreak = currentStreak;
      if (!lastVisit) {
        newStreak = 1;
      } else {
        const daysSinceLastVisit = Math.floor(
          (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastVisit <= 1) {
          newStreak = currentStreak + 1;
        } else {
          newStreak = 1; // Reset streak
        }
      }

      // Update profile with new streak
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          last_visit: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
    },
    onError: (error) => {
      console.error('Error updating streak:', error);
    }
  });

  // Update useEffect to only run once per session
  React.useEffect(() => {
    if (user?.id && !hasUpdatedStreak.current) {
      hasUpdatedStreak.current = true;
      updateStreakMutation.mutate();
    }
  }, [user?.id, updateStreakMutation]);

  // Query for user profile including streak data
  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
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
    try {
      queryClient.clear();
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      window.location.href = '/auth';
    }
  };

  const getUserDisplayName = () => {
    if (!user) return null;
    return user.user_metadata?.name || user.email;
  };

  const renderAuthLink = () => {
    if (!user) {
      return (
        <Link href="/auth" className="text-gray-600 hover:text-gray-800 transition-colors">
          Sign In
        </Link>
      );
    }

    return (
      <div className="relative" ref={profileDropdownRef}>
        <button
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          {userProfile?.username || getUserDisplayName() || 'Loading...'}
        </button>
        {isProfileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            <Link
              href="/user-dashboard"
              className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200 hover:bg-gray-100"
            >
              {userProfile?.username || getUserDisplayName() || 'Profile'}
            </Link>
            <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 flex items-center gap-2">
              <Icon icon="mdi:fire" className={`${userProfile?.currentStreak ? 'text-orange-500' : 'text-gray-400'}`} />
              <span>
                {userProfile?.currentStreak || 0} day
                {(userProfile?.currentStreak || 0) !== 1 ? 's' : ''} streak
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
                  {user ? (
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
                            <Icon icon="mdi:fire" className={`${userProfile?.currentStreak ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span>
                              {userProfile?.currentStreak || 0} day
                              {(userProfile?.currentStreak || 0) !== 1 ? 's' : ''} streak
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