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
  const [selectedNovel, setSelectedNovel] = useState<string | null>(null);

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
    if (formattedStats.length > 0 && !selectedNovel) {
      setSelectedNovel(formattedStats[0].id);
    }
    setIsLoading(false);
  };

  const handleNovelClick = async (novelId: string) => {
    setSelectedNovel(novelId);
  };

  useEffect(() => {
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Novel Statistics</h2>
        <p className="text-sm text-muted-foreground italic">Note: Our team is currently fixing an issue with view counts. They will be temporarily unavailable.</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-background border border-border rounded-lg shadow-sm">
          {stats.map((novel, index) => (
            <div 
              key={novel.id}
              className={`flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                selectedNovel === novel.id ? 'bg-muted' : ''
              } ${index !== 0 ? 'border-t border-border' : ''}`}
              onClick={() => handleNovelClick(novel.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium line-clamp-1 text-foreground">{novel.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon icon="pepicons-print:book" className="text-sm" />
                    <span>{novel.total_chapters}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:bookmark-outline" className="text-muted-foreground" />
                  <span className="text-sm font-medium">{novel.bookmarks}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:comment-outline" className="text-muted-foreground" />
                  <span className="text-sm font-medium">{novel.total_comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 