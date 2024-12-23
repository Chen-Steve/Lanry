'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

interface NovelStats {
  id: string;
  title: string;
  bookmarks: number;
  total_chapters: number;
  total_comments: number;
}

// First, let's define the interface for the raw data from Supabase
interface NovelData {
  id: string;
  title: string;
  bookmark_count: number;
  chapters: { count: number }[];
  chapter_comments: { count: number }[];
  authorProfileId: string;
}

export default function NovelStatistics() {
  const [stats, setStats] = useState<NovelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('novels')
        .select(`
          id,
          title,
          bookmark_count,
          chapters(count),
          chapter_comments(count)
        `)
        .eq('author_profile_id', session.user.id);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const formattedStats = (data as NovelData[]).map(novel => ({
        id: novel.id,
        title: novel.title,
        bookmarks: novel.bookmark_count,
        total_chapters: novel.chapters[0]?.count || 0,
        total_comments: novel.chapter_comments[0]?.count || 0
      }));

      setStats(formattedStats);
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <section aria-busy="true" className="flex justify-center p-4">
        <Icon icon="mdi:loading" className="animate-spin text-4xl text-primary/60" />
      </section>
    );
  }

  return (
    <section className="p-4">
      <h2 className="text-2xl font-bold mb-6">Novel Statistics</h2>
      
      <ul className="grid gap-4 sm:grid-cols-2">
        {stats.map((novel) => (
          <li 
            key={novel.id}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold mb-4 line-clamp-1">{novel.title}</h3>
            <ul className="grid grid-cols-3 gap-2">
              <li className="flex flex-col items-center">
                <Icon icon="mdi:bookmark" className="text-2xl text-primary mb-1" />
                <span className="text-xl font-bold">{novel.bookmarks}</span>
                <span className="text-xs text-gray-600">Bookmarks</span>
              </li>
              <li className="flex flex-col items-center">
                <Icon icon="mdi:book-open" className="text-2xl text-primary mb-1" />
                <span className="text-xl font-bold">{novel.total_chapters}</span>
                <span className="text-xs text-gray-600">Chapters</span>
              </li>
              <li className="flex flex-col items-center">
                <Icon icon="mdi:comment" className="text-2xl text-primary mb-1" />
                <span className="text-xl font-bold">{novel.total_comments}</span>
                <span className="text-xs text-gray-600">Comments</span>
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
} 