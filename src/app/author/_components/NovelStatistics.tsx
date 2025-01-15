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
  chapters_count: { count: number; }[];
  chapter_comments_count: { count: number; }[];
  novel_comments_count: { count: number; }[];
  chapters_thread_comments: { chapter_thread_comments: { count: number; }[]; }[];
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
          chapters_count:chapters(count),
          chapter_comments_count:chapter_comments(count),
          novel_comments_count:novel_comments(count),
          chapters_thread_comments:chapters(chapter_thread_comments(count))
        `)
        .eq('author_profile_id', session.user.id);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const formattedStats = (data as NovelData[]).map(novel => {
        // Calculate total thread comments by summing up counts from each chapter
        const totalThreadComments = novel.chapters_thread_comments.reduce((sum, chapter) => {
          return sum + (chapter.chapter_thread_comments[0]?.count || 0);
        }, 0);

        return {
          id: novel.id,
          title: novel.title,
          bookmarks: novel.bookmark_count,
          total_chapters: novel.chapters_count[0]?.count || 0,
          total_comments: (novel.chapter_comments_count[0]?.count || 0) + 
                         (novel.novel_comments_count[0]?.count || 0) + 
                         totalThreadComments
        };
      });

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
      <ul className="grid gap-4 sm:grid-cols-2">
        {stats.map((novel) => (
          <li 
            key={novel.id}
            className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold mb-4 line-clamp-1 text-foreground">{novel.title}</h3>
            <ul className="grid grid-cols-3 gap-2">
              <li className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{novel.bookmarks}</span>
                <span className="text-xs text-muted-foreground">Bookmarks</span>
              </li>
              <li className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{novel.total_chapters}</span>
                <span className="text-xs text-muted-foreground">Chapters</span>
              </li>
              <li className="flex flex-col items-center">
                <span className="text-xl font-bold text-foreground">{novel.total_comments}</span>
                <span className="text-xs text-muted-foreground">Comments</span>
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
} 