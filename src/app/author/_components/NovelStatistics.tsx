'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

interface NovelStats {
  id: string;
  title: string;
  views: number;
  bookmarks: number;
  total_chapters: number;
  total_comments: number;
}

// First, let's define the interface for the raw data from Supabase
interface NovelData {
  id: string;
  title: string;
  views: number;
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
          views,
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
        views: novel.views,
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
      <div className="flex justify-center items-center">
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Novel Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((novel) => (
          <div 
            key={novel.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-4">{novel.title}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{novel.views}</div>
                <div className="text-sm text-gray-500">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{novel.bookmarks}</div>
                <div className="text-sm text-gray-500">Bookmarks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{novel.total_chapters}</div>
                <div className="text-sm text-gray-500">Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{novel.total_comments}</div>
                <div className="text-sm text-gray-500">Comments</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 