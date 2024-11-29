'use client';

import { useEffect, useState } from 'react';
import ThreadList from '@/components/forum/ThreadList';
import CreateThreadButton from '@/components/forum/CreateThreadButton';
import supabase from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setIsAuthenticated(!!session?.user);
        }
      } catch (error) {
        console.error('[Init] Error:', error);
        setError(error as Error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      } else if (session?.user) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Threads</h1>
        {isLoading ? (
          <Button variant="outline" disabled>
            Loading...
          </Button>
        ) : error ? (
          <Button variant="outline" disabled>
            Error checking auth status
          </Button>
        ) : isAuthenticated ? (
          <CreateThreadButton categoryId={params.id} />
        ) : (
          <Link href="/auth" className="flex items-center">
            <Button variant="default">
              Login to Create Thread
            </Button>
          </Link>
        )}
      </div>
      <ThreadList categoryId={params.id} />
    </main>
  );
} 