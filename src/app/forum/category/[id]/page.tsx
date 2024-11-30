'use client';

import { useEffect, useState } from 'react';
import ThreadList from '@/components/forum/ThreadList';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';
import { User } from '@supabase/auth-helpers-nextjs';
import { ForumCategory } from '@/types/database';
import { Icon } from '@iconify/react';

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/forum/categories/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setCategory(data);
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };

    fetchCategory();
  }, [params.id]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (session?.user) {
        setIsAuthenticated(true);
        setUser(session.user);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to create a thread');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No access token found');

      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          content,
          categoryId: params.id
        }),
      });

      if (!response.ok) throw new Error('Failed to create thread');
      
      setIsOpen(false);
      setTitle('');
      setContent('');
      window.location.reload();
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Failed to create thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/forum" className="hover:text-gray-700">Forum</Link>
          <Icon icon="mdi:chevron-right" className="w-4 h-4" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <h1 className="text-3xl font-bold">{category?.name || 'Loading...'}</h1>
            {category?.description && (
              <p className="text-gray-600 mt-2">{category.description}</p>
            )}
          </div>
          <div>
            {isLoading ? (
              <button disabled className="px-4 py-2 bg-gray-200 rounded-md">
                Loading...
              </button>
            ) : isAuthenticated ? (
              <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Thread
              </button>
            ) : (
              <Link href="/auth">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Login to Create Thread
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Thread</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Thread Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Thread Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? 'Creating...' : 'Create Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ThreadList categoryId={params.id} />
    </main>
  );
} 