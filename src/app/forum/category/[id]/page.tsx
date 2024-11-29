'use client';

import { useEffect, useState } from 'react';
import ThreadList from '@/components/forum/ThreadList';
import CreateForumContent from '@/components/forum/CreateForumContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';
import { User } from '@supabase/auth-helpers-nextjs';
import { ForumCategory } from '@/types/database';

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/forum" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1">
          <span>← Back to Categories</span>
        </Link>
        <div className="flex justify-between items-center mt-4">
          <div>
            <h1 className="text-3xl font-bold">{category?.name || 'Loading...'}</h1>
            {category?.description && (
              <p className="text-gray-600 mt-2">{category.description}</p>
            )}
          </div>
          <div>
            {isLoading ? (
              <Button variant="outline" disabled>
                Loading...
              </Button>
            ) : isAuthenticated && user ? (
              <CreateForumContent 
                mode="thread" 
                categoryId={params.id}
                user={user}
              />
            ) : (
              <Link href="/auth" className="flex items-center">
                <Button variant="default">
                  Login to Create Thread
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      <ThreadList categoryId={params.id} />
    </main>
  );
} 