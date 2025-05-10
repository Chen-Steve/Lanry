'use client';

import { Novel, UserProfile } from '@/types/database';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { ChapterList } from '@/app/novels/[id]/_components/ChapterList';
import { getNovel } from '@/services/novelService';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function ChaptersPage({ params }: { params: { id: string } }) {
  const { id: novelSlug } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchNovelAndAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!profile) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  username: session.user.user_metadata?.full_name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  updated_at: new Date().toISOString(),
                }
              ])
              .select()
              .single();

            if (!insertError) {
              profile = newProfile;
            }
          }
          
          setUserProfile(profile);
        }
        
        const data = await getNovel(novelSlug, session?.user?.id);
        if (data) {
          setNovel(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovelAndAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [novelSlug]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!novel) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <div className="flex items-center gap-2 mb-6">
        <Link 
          href={`/novels/${novel.slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </Link>
      </div>
      <ChapterList
        initialChapters={novel.chapters}
        volumes={novel.volumes}
        novelId={novel.id}
        novelSlug={novel.slug}
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        novelAuthorId={novel.author_profile_id}
      />
    </div>
  );
} 