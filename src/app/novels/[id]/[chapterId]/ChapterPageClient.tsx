'use client';


import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChapterHeader from './_components/content/ChapterHeader';
import ChapterContent from './_components/content/ChapterContent';
import ChapterProgressBar from './_components/navigation/ChapterBar';
import ChapterNavigation from './_components/navigation/ChapterNavigation';
import ChapterComments from './_components/interaction/comments/ChapterComments';
import ChapterPurchaseButton from './_components/interaction/ChapterPurchaseButton';
import PullToLoadNext from './_components/navigation/PullToLoadNext';
import { ChapterWithNovel } from '@/types/database';

interface ChapterNavigation {
  prevChapter: { id: string; chapter_number: number; part_number?: number | null; title: string } | null;
  nextChapter: { id: string; chapter_number: number; part_number?: number | null; title: string } | null;
  availableChapters: Array<{ chapter_number: number; part_number?: number | null; volume_id?: string }>;
  volumes: Array<{ id: string; title: string; volume_number: number }>;
}

interface ChapterPageClientProps {
  novelId: string;
  chapter: ChapterWithNovel;
  navigation: ChapterNavigation;
  userId: string | null;
}

// Utility copied from original file
const isIndefinitelyLocked = (chapter: { publish_at?: string | null }): boolean => {
  if (!chapter.publish_at) return false;
  const publishDate = new Date(chapter.publish_at);
  const fiftyYearsFromNow = new Date();
  fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
  return publishDate > fiftyYearsFromNow;
};

export default function ChapterPageClient({ novelId, chapter, navigation, userId }: ChapterPageClientProps) {
  // Client-side authentication state
  const [clientUserId, setClientUserId] = useState<string | null>(userId);
  
  
  // Local UI states that should stay on the client
  const [isLocked, setIsLocked] = useState(chapter.isLocked ?? false);
  const [unlockCheckComplete, setUnlockCheckComplete] = useState(!chapter.isLocked);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [hideComments, setHideComments] = useLocalStorage('chapter-hide-comments', false);
  const [showProfanity, setShowProfanity] = useLocalStorage('chapter-show-profanity', true);
  const [zenMode, setZenMode] = useLocalStorage('chapter-zen-mode', false);
  const [fontFamily, setFontFamily] = useLocalStorage(
    'chapter-font-family',
    'ui-sans-serif, system-ui, sans-serif'
  );
  const [fontSize, setFontSize] = useLocalStorage('chapter-font-size', 16);

  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Derived settings based on Zen Mode
  const effectiveHideComments = zenMode ? true : hideComments;
  const effectiveShowProfanity = zenMode ? true : showProfanity;
  const hideAuthorWords = zenMode ? true : false;

  // Get client-side authentication state
  useEffect(() => {
    const getClientAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;

        setClientUserId(currentUserId);
      } catch (error) {
        console.error('Error getting client session:', error);
        setClientUserId(null);
      }
    };

    getClientAuth();
  }, []);

  // If the chapter was marked as locked on the server, double-check on the client in case the user has purchased it recently
  useEffect(() => {
    const checkUnlock = async () => {
      if (!isLocked) {
        setUnlockCheckComplete(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUnlockCheckComplete(true);
          return;
        }

        // Resolve numeric novel id in case we are using a slug
        const { data: novel, error: novelError } = await supabase
          .from('novels')
          .select('id')
          .or(`id.eq.${novelId},slug.eq.${novelId}`)
          .single();

        if (novelError || !novel) {
          setUnlockCheckComplete(true);
          return;
        }

        let unlockQuery = supabase
          .from('chapter_unlocks')
          .select('id')
          .eq('profile_id', session.user.id)
          .eq('novel_id', novel.id)
          .eq('chapter_number', chapter.chapter_number);

        if (chapter.part_number == null) {
          unlockQuery = unlockQuery.is('part_number', null);
        } else {
          unlockQuery = unlockQuery.eq('part_number', chapter.part_number);
        }

        const { data: unlock } = await unlockQuery.maybeSingle();
        if (unlock) {
          setIsLocked(false);
        }
      } catch (error) {
        console.error('Error verifying unlock status:', error);
      } finally {
        setUnlockCheckComplete(true);
      }
    };

    checkUnlock();
    // We only need to run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle URL fragment scrolling after mount
  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const element = document.getElementById(hash);
      if (element) {
        // Add a delay to ensure DOM is fully rendered with all content
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, []);

  // Helper to navigate to another chapter
  const handleChapterSelect = useCallback((chapterNum: number, partNum?: number | null) => {
    const partSuffix = partNum ? `-p${partNum}` : '';
    window.location.href = `/novels/${novelId}/c${chapterNum}${partSuffix}`;
  }, [novelId]);

  // Quick safety – if chapter data is missing (should not happen)
  if (!chapter) return notFound();

  // Check free/publish logic (same as original)
  const isPublished = !chapter.publish_at || new Date(chapter.publish_at) <= new Date();
  const shouldBeFree = isPublished && !!chapter.publish_at;

  // While we're verifying unlock status, show a simple loading message
  if (!unlockCheckComplete && isLocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">
        <Icon icon="mdi:loading" className="animate-spin text-2xl mx-auto mb-2" />
        <p>Checking chapter access...</p>
      </div>
    );
  }

  // Render locked states first (mirrors original order)
  if (unlockCheckComplete && isLocked && !isIndefinitelyLocked(chapter)) {
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
          <ChapterPurchaseButton
            novelId={novelId}
            chapterNumber={chapter.chapter_number}
            partNumber={chapter.part_number}
            coins={chapter.coins}
            authorId={chapter.novel.author_profile_id}
            userProfileId={clientUserId ?? undefined}
            isAuthenticated={!!clientUserId}
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

  if (unlockCheckComplete && isLocked && !shouldBeFree) {
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
              userProfileId={userId ?? undefined}
              isAuthenticated={!!userId}
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
        authorProfile={chapter.authorProfile}
        hideComments={effectiveHideComments}
        showProfanity={effectiveShowProfanity}
        hideAuthorWords={hideAuthorWords}
        settingsButtonRef={settingsButtonRef}
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
      {!zenMode && (
        <div id="chapter-comments" className="mt-2 pt-2">
          <ChapterComments
            chapterId={chapter.id}
            authorId={chapter.novel.author_profile_id}
            isFirstChapter={chapter.chapter_number === 1}
          />
        </div>
      )}

      {/* Pull to Load Next */}
      <PullToLoadNext
        nextChapter={navigation.nextChapter}
        novelId={novelId}
        isLoading={false}
      />

      <ChapterProgressBar
        novelId={novelId}
        onFontChange={setFontFamily}
        onSizeChange={setFontSize}
        currentFont={fontFamily}
        currentSize={fontSize}
        isCommentOpen={isCommentOpen}
        novelCoverUrl={chapter.novel.coverImageUrl}
        novelTitle={chapter.novel.title}
        hideComments={hideComments}
        onHideCommentsChange={setHideComments}
        showProfanity={showProfanity}
        onShowProfanityChange={setShowProfanity}
        zenMode={zenMode}
        onZenModeChange={setZenMode}
        settingsButtonRef={settingsButtonRef}
        floatingDesktopModal
        currentChapter={chapter.chapter_number}
        currentPartNumber={chapter.part_number}
        currentVolumeId={chapter.volume_id}
        availableChapters={navigation.availableChapters}
        volumes={navigation.volumes}
      />
    </div>
  );
}
