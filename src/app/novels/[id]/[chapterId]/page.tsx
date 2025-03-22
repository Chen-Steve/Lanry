'use client';

import { useEffect, useState } from 'react';
import { getChapter, getChapterNavigation, getTotalChapters } from '@/services/chapterService';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generateUUID } from '@/lib/utils';
import { ChapterWithNovel } from '@/types/database';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChapterHeader from './_components/content/ChapterHeader';
import ChapterContent from './_components/content/ChapterContent';
import supabase from '@/lib/supabaseClient';
import ChapterProgressBar from './_components/navigation/ChapterBar';
import ChapterSidebar from './_components/navigation/ChapterSidebar';
import ChapterNavigation from './_components/navigation/ChapterNavigation';
import ChapterComments from './_components/interaction/comments/ChapterComments';
import { useReadingTimeTracker } from '@/hooks/useReadingTimeTracker';
import ChapterPurchaseButton from './_components/interaction/ChapterPurchaseButton';
import PullToLoadNext from './_components/navigation/PullToLoadNext';

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled more than 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-300 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <Icon icon="mdi:chevron-up" className="text-xl" />
    </button>
  );
}

// Add this function near the top of the file
const updateReadingHistory = async (
  novelId: string, 
  chapterNumber: number,
  partNumber?: number | null
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First, get the actual novel ID if we're using a slug
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id')
      .or(`id.eq.${novelId},slug.eq.${novelId}`)
      .single();

    if (novelError || !novel) {
      console.error('Error getting novel:', novelError);
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('reading_history')
      .upsert({
        id: generateUUID(),
        profile_id: user.id,
        novel_id: novel.id,
        last_chapter: chapterNumber,
        last_part_number: partNumber,
        last_read: now,
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'profile_id,novel_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating reading history:', error);
  }
};

interface ChapterNavigation {
  prevChapter: { id: string; chapter_number: number; part_number?: number | null; title: string } | null;
  nextChapter: { id: string; chapter_number: number; part_number?: number | null; title: string } | null;
  availableChapters: Array<{ chapter_number: number; part_number?: number | null; volume_id?: string }>;
  volumes: Array<{ id: string; title: string; volume_number: number }>;
}

const initialNavigation: ChapterNavigation = {
  prevChapter: null,
  nextChapter: null,
  availableChapters: [],
  volumes: []
};

export default function ChapterPage({ params }: { params: { id: string; chapterId: string } }) {
  const { id: novelId, chapterId } = params;
  const [chapter, setChapter] = useState<ChapterWithNovel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<ChapterNavigation>(initialNavigation);
  const [totalChapters, setTotalChapters] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [fontFamily, setFontFamily] = useLocalStorage(
    'chapter-font-family',
    'ui-sans-serif, system-ui, sans-serif'
  );
  const [fontSize, setFontSize] = useLocalStorage('chapter-font-size', 16);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Add the reading time tracker
  useReadingTimeTracker();

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const loadChapterData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Extract chapter number and part number from chapterId
        const match = chapterId.match(/^c(\d+)(?:-p(\d+))?$/);
        if (!match) {
          setError('Invalid chapter ID format');
          setIsLoading(false);
          return;
        }

        const chapterNumber = parseInt(match[1]);
        const partNumber = match[2] ? parseInt(match[2]) : null;

        const [chapterData, navigationData, totalChaptersCount] = await Promise.all([
          getChapter(novelId, chapterNumber, partNumber),
          getChapterNavigation(novelId, chapterNumber, partNumber),
          getTotalChapters(novelId)
        ]);

        if (!chapterData) {
          setError('Chapter not found');
          setIsLoading(false);
          return;
        }

        setChapter(chapterData);
        setNavigation(navigationData);
        setTotalChapters(totalChaptersCount);
      } catch (error) {
        console.error('Error loading chapter:', error);
        setError('Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    };

    loadChapterData();
  }, [novelId, chapterId]);

  useEffect(() => {
    if (chapter) {
      updateReadingHistory(novelId, chapter.chapter_number, chapter.part_number);
    }
  }, [novelId, chapter]);

  const handleChapterSelect = (chapterNum: number, partNum?: number | null) => {
    const partSuffix = partNum ? `-p${partNum}` : '';
    window.location.href = `/novels/${novelId}/c${chapterNum}${partSuffix}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 animate-pulse">
        {/* Header skeleton */}
        <div className="mb-2 md:mb-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          </div>
        </div>

        {/* Navigation skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-[80px] sm:w-[90px] h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-[140px] sm:w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-[80px] sm:w-[90px] h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/novels/${novelId}`}
          className="text-black hover:text-gray-700 flex items-center gap-1 text-sm md:text-base mb-8"
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back to Novel</span>
        </Link>
        
        <div className="text-center py-12">
          <Icon 
            icon="mdi:lock" 
            className="mx-auto text-4xl text-gray-400 mb-4"
          />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error}
          </h1>
          {error === 'This chapter is not yet available' && chapter && (
            <div className="space-y-2">
              <p className="text-gray-600">
                This chapter will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!chapter) return notFound();

  // Show purchase button if chapter is locked and not indefinitely locked
  if (chapter.isLocked && (!chapter.publish_at || new Date(chapter.publish_at).getFullYear() <= new Date().getFullYear() + 50)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/novels/${novelId}`}
          className="text-black hover:text-gray-700 flex items-center gap-1 text-sm md:text-base mb-8"
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back to Novel</span>
        </Link>

        {/* Top Navigation */}
        <div className="mb-6">
          <ChapterNavigation
            navigation={navigation}
            novelId={novelId}
            currentChapter={chapter?.chapter_number || 0}
            currentPartNumber={chapter?.part_number}
            currentVolumeId={chapter?.volume_id}
            availableChapters={navigation.availableChapters}
            volumes={navigation.volumes}
            handleChapterSelect={handleChapterSelect}
            position="top"
          />
        </div>
        
        <div className="text-center py-12">
          <Icon 
            icon="mdi:lock" 
            className="mx-auto text-4xl text-gray-400 mb-4"
          />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Unlock Chapter {chapter.chapter_number}{chapter.part_number ? `.${chapter.part_number}` : ''}
          </h1>
          <p className="text-gray-600 mb-6">
            This chapter requires {chapter.coins} coins to unlock.
          </p>
          <ChapterPurchaseButton
            novelId={novelId}
            chapterNumber={chapter.chapter_number}
            partNumber={chapter.part_number}
            coins={chapter.coins}
            authorId={chapter.novel.author_profile_id}
            userProfileId={user?.id}
            isAuthenticated={!!user}
            publishAt={chapter.publish_at}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="pt-4">
          <ChapterNavigation
            navigation={navigation}
            novelId={novelId}
            currentChapter={chapter?.chapter_number || 0}
            currentPartNumber={chapter?.part_number}
            currentVolumeId={chapter?.volume_id}
            availableChapters={navigation.availableChapters}
            volumes={navigation.volumes}
            handleChapterSelect={handleChapterSelect}
            position="bottom"
          />
        </div>
      </div>
    );
  }

  // Check if the chapter should be free:
  // 1. It's published (publish date has passed)
  // 2. It was an advanced chapter that is now published
  const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
  const shouldBeFree = isPublished && chapter.publish_at; // If it has a publish date and it's passed, it should be free

  if (chapter.isLocked && !shouldBeFree) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/novels/${novelId}`}
          className="text-black hover:text-gray-700 flex items-center gap-1 text-sm md:text-base mb-8"
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back to Novel</span>
        </Link>

        {/* Top Navigation */}
        <div className="mb-6">
          <ChapterNavigation
            navigation={navigation}
            novelId={novelId}
            currentChapter={chapter?.chapter_number || 0}
            currentPartNumber={chapter?.part_number}
            currentVolumeId={chapter?.volume_id}
            availableChapters={navigation.availableChapters}
            volumes={navigation.volumes}
            handleChapterSelect={handleChapterSelect}
            position="top"
          />
        </div>
        
        <div className="text-center py-12">
          <Icon 
            icon="ph:lock-key-bold" 
            className="mx-auto text-4xl text-primary mb-4"
          />
          <h1 className="text-xl font-semibold mb-4">
            Chapter {chapter.chapter_number}{chapter.part_number ? ` Part ${chapter.part_number}` : ''}: {chapter.title}
          </h1>
          <div className="space-y-4 max-w-md mx-auto">
            <ChapterPurchaseButton
              novelId={novelId}
              chapterNumber={chapter.chapter_number}
              partNumber={chapter.part_number}
              coins={chapter.coins}
              authorId={chapter.novel?.author_profile_id || ''}
              userProfileId={user?.id}
              isAuthenticated={!!user}
              publishAt={chapter.publish_at}
            />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="pt-4">
          <ChapterNavigation
            navigation={navigation}
            novelId={novelId}
            currentChapter={chapter?.chapter_number || 0}
            currentPartNumber={chapter?.part_number}
            currentVolumeId={chapter?.volume_id}
            availableChapters={navigation.availableChapters}
            volumes={navigation.volumes}
            handleChapterSelect={handleChapterSelect}
            position="bottom"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
      <ChapterHeader
        novelId={novelId}
        novelTitle={chapter.novel.title}
        author={chapter.novel.author}
      />

      {/* Top Navigation */}
      <div className="mb-6">
        <ChapterNavigation
          navigation={navigation}
          novelId={novelId}
          currentChapter={chapter?.chapter_number || 0}
          currentPartNumber={chapter?.part_number}
          currentVolumeId={chapter?.volume_id}
          availableChapters={navigation.availableChapters}
          volumes={navigation.volumes}
          handleChapterSelect={handleChapterSelect}
          position="top"
        />
      </div>

      <ChapterContent
        novelId={chapter.novel.id}
        chapterNumber={chapter.chapter_number}
        partNumber={chapter.part_number}
        title={chapter.title}
        createdAt={chapter.created_at}
        content={chapter.content}
        fontFamily={fontFamily}
        fontSize={fontSize}
        authorThoughts={chapter.author_thoughts}
        onCommentStateChange={setIsCommentOpen}
        authorId={chapter.novel.author_profile_id}
        ageRating={chapter.age_rating}
        chapterId={chapter.id}
        isTranslator={chapter.hasTranslatorAccess}
        publishAt={chapter.publish_at}
      />

      {/* Bottom Navigation */}
      <div className="pt-4">
        <ChapterNavigation
          navigation={navigation}
          novelId={novelId}
          currentChapter={chapter?.chapter_number || 0}
          currentPartNumber={chapter?.part_number}
          currentVolumeId={chapter?.volume_id}
          availableChapters={navigation.availableChapters}
          volumes={navigation.volumes}
          handleChapterSelect={handleChapterSelect}
          position="bottom"
        />
      </div>

      {/* Chapter Comments */}
      <div className="mt-2 border-t pt-2">
        <ChapterComments
          chapterId={chapter.id}
          authorId={chapter.novel.author_profile_id}
        />
      </div>

      {/* Pull to Load Next */}
      <PullToLoadNext
        nextChapter={navigation.nextChapter}
        novelId={novelId}
        isLoading={isLoading}
      />

      <ScrollToTopButton />
      <ChapterProgressBar
        novelId={novelId}
        currentChapter={chapter.chapter_number}
        totalChapters={totalChapters}
        navigation={navigation}
        onFontChange={setFontFamily}
        onSizeChange={setFontSize}
        currentFont={fontFamily}
        currentSize={fontSize}
        isCommentOpen={isCommentOpen}
        firstChapter={Math.min(...navigation.availableChapters.map(ch => ch.chapter_number))}
      />
      
      <ChapterSidebar
        onFontChange={setFontFamily}
        onSizeChange={setFontSize}
        currentFont={fontFamily}
        currentSize={fontSize}
      />
    </div>
  );
} 