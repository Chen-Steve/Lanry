'use client';

import { Novel, UserProfile } from '@/types/database';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useSupabase } from '@/app/providers';
import { ChapterList } from '@/app/novels/[id]/_components/ChapterList';
import { getNovel } from '@/services/novelService';
import { notFound } from 'next/navigation';


export default function ChaptersPage({ params }: { params: { id: string } }) {
  const { user } = useSupabase();
  const { id: novelSlug } = params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchNovelAndAuth = async () => {
      try {
        setIsAuthenticated(!!user);
        
        if (user) {
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!profile) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  username: user.user_metadata?.full_name,
                  avatar_url: user.user_metadata?.avatar_url,
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
        } else {
          setUserProfile(null);
        }
        
        const data = await getNovel(novelSlug, user?.id, false);
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
  }, [novelSlug, user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!novel) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
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