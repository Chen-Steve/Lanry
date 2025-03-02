'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

// Define profile type
interface Profile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  current_streak: number;
  role: string;
  coins: number;
}

export default function DebugPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Check if profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code === 'PGRST116') {
            setProfile(null);
          } else if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setError('Error checking authentication status');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const createProfile = async () => {
    if (!user) {
      setError('No authenticated user found');
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      // Generate username from email or random string
      const username = user.email 
        ? user.email.split('@')[0] 
        : `user_${Math.random().toString(36).slice(2, 7)}`;
      
      // Create profile
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          current_streak: 0,
          role: 'USER',
          coins: 0
        }]);

      if (createError) {
        console.error('Error creating profile:', createError);
        setError(`Failed to create profile: ${createError.message}`);
        return;
      }

      // Create reading time record
      const { error: readingTimeError } = await supabase
        .from('reading_time')
        .insert([{
          profile_id: user.id,
          total_minutes: 0
        }]);

      if (readingTimeError) {
        console.error('Error creating reading time:', readingTimeError);
        setError(`Profile created but failed to create reading time: ${readingTimeError.message}`);
      } else {
        setSuccess('Profile created successfully!');
        
        // Refresh profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Unexpected error creating profile');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="svg-spinners:180-ring" className="w-12 h-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          {user ? (
            <div className="space-y-2">
              <p className="text-green-600 dark:text-green-400 font-medium">✓ Authenticated</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">User ID:</p>
                  <p className="font-mono text-sm break-all">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email:</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Provider:</p>
                  <p>{user.app_metadata?.provider || 'email'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created At:</p>
                  <p>{new Date(user.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">Not authenticated</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Status</h2>
          {profile ? (
            <div className="space-y-2">
              <p className="text-green-600 dark:text-green-400 font-medium">✓ Profile exists</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Profile ID:</p>
                  <p className="font-mono text-sm break-all">{profile.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Username:</p>
                  <p>{profile.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created At:</p>
                  <p>{new Date(profile.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Coins:</p>
                  <p>{profile.coins}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-red-600 dark:text-red-400 mb-4">No profile found</p>
              {user && (
                <button
                  onClick={createProfile}
                  disabled={creating}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Icon icon="svg-spinners:180-ring" className="w-4 h-4" />
                      Creating Profile...
                    </>
                  ) : (
                    <>Create Profile</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-md mb-6">
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}
        
        <div className="flex gap-4">
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Home
          </Link>
          <Link 
            href="/auth"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Go to Auth Page
          </Link>
        </div>
      </div>
    </div>
  );
} 