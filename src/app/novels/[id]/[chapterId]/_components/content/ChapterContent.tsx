'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { formatDate } from '@/lib/utils';
import { getTextStyles, formatText, extractedFootnotes, ExtractedFootnote } from '@/lib/textFormatting';
import { filterExplicitContent } from '@/lib/contentFiltering';
import CommentPopover from '../interaction/comments/CommentBar';
import { useComments } from '@/hooks/useComments';
import { Icon } from '@iconify/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ChapterComment as BaseChapterComment } from '@/types/database';
import FootnotesList from './FootnotesList';
import { toast } from 'sonner';
import ScreenshotProtection from '../ScreenshotProtection';
import ChapterParagraph from './ChapterParagraph';
import TranslatorChapterEdit from './TranslatorChapterEdit';
import { TranslatorLinks } from '@/app/novels/[id]/_components/TranslatorLinks';
import supabase from '@/lib/supabaseClient';

interface ChapterCommentWithProfile extends Omit<BaseChapterComment, 'profile'> {
  profile?: {
    username: string | null;
    avatar_url?: string;
    id?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR';
  };
}

interface ChapterContentProps {
  novelId: string;
  chapterNumber: number;
  partNumber?: number | null;
  title: string;
  createdAt: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  authorThoughts?: string;
  onCommentStateChange: (isOpen: boolean) => void;
  authorId: string;
  ageRating: 'EVERYONE' | 'TEEN' | 'MATURE';
  chapterId: string;
  isTranslator?: boolean;
  publishAt?: string;
  hideComments?: boolean;
  showProfanity?: boolean;
  authorProfile?: {
    username: string;
    avatar_url?: string;
    role: 'AUTHOR' | 'TRANSLATOR' | 'USER';
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
    author_bio?: string;
  };
  settingsButtonRef?: React.RefObject<HTMLButtonElement>;
}

export default function ChapterContent({
  novelId,
  chapterNumber,
  partNumber,
  title,
  createdAt,
  content,
  fontFamily,
  fontSize,
  authorThoughts,
  onCommentStateChange,
  authorId,
  ageRating,
  chapterId,
  isTranslator = false,
  publishAt,
  authorProfile,
  hideComments = false,
  showProfanity = false,
  settingsButtonRef
}: ChapterContentProps) {
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { comments, addComment, deleteComment, updateComment, isAuthenticated, isLoading, userId } = useComments(novelId, chapterNumber);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isChapterBarVisible, setIsChapterBarVisible] = useState(false);
  const [footnotes, setFootnotes] = useState<ExtractedFootnote[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  
  // Check if the chapter is indefinitely locked
  const isIndefinitelyLocked = publishAt && new Date(publishAt).getFullYear() > new Date().getFullYear() + 50;

  const handleCloseComment = () => {
    setSelectedParagraphId(null);
    onCommentStateChange(false);
  };

  const handleAddComment = async (paragraphId: string, content: string) => {
    await addComment(paragraphId, content);
  };

  const handleCommentClick = useCallback((
    event: React.MouseEvent<Element>,
    paragraphId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedParagraphId(paragraphId);
    onCommentStateChange(true);
  }, [onCommentStateChange]);

  // Extract paragraphs and footnotes
  const paragraphs = filterExplicitContent(content, !showProfanity)
    .split('\n\n')
    .filter(p => p.trim());

  // Handle smooth scrolling for footnote links
  useEffect(() => {
    const handleFootnoteNavigation = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // For references in main text (going down to footnotes)
      const footnoteLink = target.closest('[data-footnote-ref]');
      
      // For back links in footnotes section (going up to references)
      const backToRefLink = target.closest('[data-back-to-ref]');
      
      if (footnoteLink && footnoteLink instanceof HTMLAnchorElement) {
        e.preventDefault();
        
        const footnoteNumber = footnoteLink.getAttribute('data-footnote-ref');
        const footnoteElement = document.getElementById(`footnote-${footnoteNumber}`);
        
        if (footnoteElement) {
          // Remove any existing highlights
          document.querySelectorAll('.footnote-highlight').forEach(el => {
            el.classList.remove('footnote-highlight');
          });
          
          // Smooth scroll to the footnote
          window.scrollTo({
            top: footnoteElement.offsetTop - 100, // Add some space above
            behavior: 'smooth'
          });
          
          // Add a highlight effect to the footnote
          footnoteElement.classList.add('footnote-highlight');
          setTimeout(() => {
            footnoteElement.classList.remove('footnote-highlight');
          }, 2000);
        }
      }
      
      // Handle back-to-reference links
      if (backToRefLink && backToRefLink instanceof HTMLAnchorElement) {
        e.preventDefault();
        
        const refNumber = backToRefLink.getAttribute('data-back-to-ref');
        const refElement = document.getElementById(`footnote-ref-${refNumber}`);
        
        if (refElement) {
          // Remove any existing highlights
          document.querySelectorAll('.footnote-highlight').forEach(el => {
            el.classList.remove('footnote-highlight');
          });
          
          // Smooth scroll to the reference
          window.scrollTo({
            top: refElement.offsetTop - 100, // Add some space above
            behavior: 'smooth'
          });
          
          // Add a highlight effect to the reference
          refElement.classList.add('footnote-highlight');
          setTimeout(() => {
            refElement.classList.remove('footnote-highlight');
          }, 2000);
        }
      }
    };
    
    // Add click event listener for footnote navigation
    document.addEventListener('click', handleFootnoteNavigation);
    
    // Also handle initial navigation if hash is present in URL
    const handleInitialNavigation = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        
        if (element) {
          // Remove any existing highlights
          document.querySelectorAll('.footnote-highlight').forEach(el => {
            el.classList.remove('footnote-highlight');
          });
          
          setTimeout(() => {
            window.scrollTo({
              top: element.offsetTop - 100,
              behavior: 'smooth'
            });
            
            element.classList.add('footnote-highlight');
            setTimeout(() => {
              element.classList.remove('footnote-highlight');
            }, 2000);
          }, 300); // Small delay to ensure page is fully loaded
        }
      }
    };
    
    // Run on initial load
    handleInitialNavigation();
    
    // Also run when hash changes
    window.addEventListener('hashchange', handleInitialNavigation);
    
    return () => {
      document.removeEventListener('click', handleFootnoteNavigation);
      window.removeEventListener('hashchange', handleInitialNavigation);
    };
  }, []);

  // Extract footnotes from content
  useEffect(() => {
    // Process the content to extract footnotes
    formatText(content, true);
    setFootnotes([...extractedFootnotes]);
  }, [content]);

  useEffect(() => {
    // Use event delegation for link previews
    const handleInteractions = (e: Event) => {
      const target = e.target instanceof Element ? e.target : (e.target as { parentElement?: Element })?.parentElement;
      if (!target) return;

      // Handle link previews
      const linkWrapper = target.closest('.link-wrapper');
      if (linkWrapper && (e.type === 'mouseenter' || e.type === 'mouseleave')) {
        const preview = linkWrapper.querySelector('.link-preview') as HTMLElement;
        if (!preview) return;

        if (e.type === 'mouseenter') {
          preview.classList.remove('opacity-0', 'invisible');
          preview.classList.add('opacity-100', 'visible');

          // Position the preview
          const rect = linkWrapper.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const spaceAbove = rect.top;
          const spaceBelow = viewportHeight - rect.bottom;

          preview.style.minWidth = '200px';
          preview.style.left = '50%';
          preview.style.transform = 'translateX(-50%)';

          if (spaceBelow >= 100 || spaceBelow > spaceAbove) {
            preview.style.top = 'calc(100% + 5px)';
            preview.style.bottom = 'auto';
          } else {
            preview.style.bottom = 'calc(100% + 5px)';
            preview.style.top = 'auto';
          }
        } else {
          preview.classList.remove('opacity-100', 'visible');
          preview.classList.add('opacity-0', 'invisible');
        }
      }
    };

    // Add event listeners
    document.addEventListener('mouseenter', handleInteractions, true);
    document.addEventListener('mouseleave', handleInteractions, true);
    
    return () => {
      document.removeEventListener('mouseenter', handleInteractions, true);
      document.removeEventListener('mouseleave', handleInteractions, true);
    };
  }, []);

  // Fetch initial likes count and user's like status
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        console.log('Fetching initial likes for chapter:', chapterNumber, 'novel:', novelId);
        
        // Get chapter data
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('id, like_count')
          .eq('chapter_number', chapterNumber)
          .eq('novel_id', novelId)
          .single();

        if (chapterError) throw chapterError;
        
        console.log('Initial chapter data:', chapter);
        setLikeCount(chapter.like_count || 0);
        console.log('Set initial like count to:', chapter.like_count || 0);

        // Check if user has liked this chapter
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          const { data, error: likeError } = await supabase
            .from('chapter_likes')
            .select('id')
            .eq('chapter_id', chapter.id)
            .eq('profile_id', session.session.user.id);

          if (likeError) throw likeError;
          const userLiked = data && data.length > 0;
          console.log('User liked status:', userLiked);
          setIsLiked(userLiked);
        }
      } catch (err) {
        console.error('Error fetching likes:', err);
      }
    };

    fetchLikes();
  }, [chapterNumber, novelId]);

  const handleLikeClick = async () => {
    console.log('Chapter like button clicked');
    
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      toast.error('Must be logged in to like chapters');
      return;
    }

    console.log('User authenticated:', session.session.user.id);

    if (isLikeLoading) return;
    setIsLikeLoading(true);

    try {
      // Get chapter ID first
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('chapter_number', chapterNumber)
        .eq('novel_id', novelId)
        .single();

      if (chapterError) throw chapterError;
      console.log('Found chapter:', chapter);

      if (isLiked) {
        console.log('Attempting to unlike chapter');
        
        // Unlike
        const { error: deleteLikeError } = await supabase
          .from('chapter_likes')
          .delete()
          .eq('chapter_id', chapter.id)
          .eq('profile_id', session.session.user.id);

        if (deleteLikeError) {
          console.error('Delete like error:', deleteLikeError);
          throw deleteLikeError;
        }
        console.log('Successfully deleted like record');

        // Get current like count from database
        const { data: currentChapter, error: getCurrentError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (getCurrentError) {
          console.error('Error getting current count:', getCurrentError);
          throw getCurrentError;
        }

        const currentCount = currentChapter?.like_count || 0;
        const newCount = Math.max(0, currentCount - 1);
        
        console.log('Current count from DB:', currentCount, 'New count will be:', newCount);

        // Update the like count in chapters table
        const { error: updateError } = await supabase
          .from('chapters')
          .update({ like_count: newCount })
          .eq('id', chapter.id);

        if (updateError) {
          console.error('Update chapter count error:', updateError);
          throw updateError;
        }
        console.log('Successfully updated chapter like count (unlike)');

        // Verify the update worked
        const { data: verifyChapter, error: verifyError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (verifyError) {
          console.error('Error verifying update:', verifyError);
        } else {
          console.log('Verified chapter like count in DB:', verifyChapter?.like_count);
        }

        setLikeCount(newCount);
        setIsLiked(false);
        console.log('Updated UI state: unliked, count:', newCount);
      } else {
        console.log('Attempting to like chapter');
        
        // Like
        const now = new Date().toISOString();
        const { error: createLikeError } = await supabase
          .from('chapter_likes')
          .insert({
            id: crypto.randomUUID(),
            profile_id: session.session.user.id,
            chapter_id: chapter.id,
            novel_id: novelId,
            created_at: now,
            updated_at: now
          });

        if (createLikeError) {
          console.error('Create like error:', createLikeError);
          throw createLikeError;
        }
        console.log('Successfully created like record');

        // Get current like count from database
        const { data: currentChapter, error: getCurrentError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (getCurrentError) {
          console.error('Error getting current count:', getCurrentError);
          throw getCurrentError;
        }

        const currentCount = currentChapter?.like_count || 0;
        const newCount = currentCount + 1;
        
        console.log('Current count from DB:', currentCount, 'New count will be:', newCount);

        // Update the like count in chapters table
        const { error: updateError } = await supabase
          .from('chapters')
          .update({ like_count: newCount })
          .eq('id', chapter.id);

        if (updateError) {
          console.error('Update chapter count error:', updateError);
          throw updateError;
        }
        console.log('Successfully updated chapter like count (like)');

        // Verify the update worked
        const { data: verifyChapter, error: verifyError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (verifyError) {
          console.error('Error verifying update:', verifyError);
        } else {
          console.log('Verified chapter like count in DB:', verifyChapter?.like_count);
        }

        setLikeCount(newCount);
        setIsLiked(true);
        console.log('Updated UI state: liked, count:', newCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Add font optimization
  useEffect(() => {
    // Preload the font to prevent layout shift
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: ${fontFamily};
        font-display: swap;
        size-adjust: 100%;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [fontFamily]);

  // Toggle ChapterBar function
  const toggleChapterBar = () => {
    // Create custom event to trigger ChapterBar toggle
    const event = new CustomEvent('toggleChapterBar', {
      detail: { toggle: true }
    });
    document.dispatchEvent(event);
    console.log('Dispatched toggleChapterBar event');
    setIsChapterBarVisible(!isChapterBarVisible);
  };

  // Listen for ChapterBar visibility changes
  useEffect(() => {
    const handleChapterBarEvent = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.isVisible === 'boolean') {
        setIsChapterBarVisible(event.detail.isVisible);
      }
    };

    // Add event listener for the custom event
    document.addEventListener('toggleChapterBar', handleChapterBarEvent as EventListener);

    return () => {
      document.removeEventListener('toggleChapterBar', handleChapterBarEvent as EventListener);
    };
  }, []);

  // Handle click to reveal individual censored words
  useEffect(() => {
    const handleReveal = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.censored-word');
      if (target && !showProfanity) {
        e.preventDefault();
        target.classList.toggle('revealed');
      }
    };
    document.addEventListener('click', handleReveal);
    return () => document.removeEventListener('click', handleReveal);
  }, [showProfanity]);

  return (
    <div className="max-w-2xl mx-auto" ref={contentRef}>
      <div 
        className="prose dark:prose-invert max-w-none"
        style={{ 
          fontFamily,
          fontSize: `${fontSize}px`,
          minHeight: `${Math.min(content.length * 0.5, 200)}px`
        }}
      >
        <div className="mb-4 max-w-2xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white">
                  Chapter {chapterNumber}
                  {partNumber && <span> Part {partNumber}</span>}
                  {title && <span>: {title}</span>}
                </h2>
                {ageRating === 'MATURE' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md flex items-center gap-1">
                    <Icon icon="mdi:alert" className="w-3.5 h-3.5" />
                    Mature
                  </span>
                )}
                {ageRating === 'TEEN' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-md flex items-center gap-1">
                    <Icon icon="mdi:alert" className="w-3.5 h-3.5" />
                    Teen
                  </span>
                )}
                {isIndefinitelyLocked && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-accent text-muted-foreground rounded-md flex items-center gap-1">
                    <Icon icon="mdi:clock-outline" className="w-3.5 h-3.5" />
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {isIndefinitelyLocked ? 'Not yet available' : `Published ${formatDate(createdAt)}`}
              </p>
              {!hideComments && !isIndefinitelyLocked && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can turn off comments in settings
                </p>
              )}
              {!showProfanity && !isIndefinitelyLocked && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  You can turn off the profanity filter in settings
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {isDesktop && !isIndefinitelyLocked && (
                <button
                  ref={settingsButtonRef}
                  onClick={toggleChapterBar}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md bg-background hover:bg-accent border border-border transition-colors"
                  title="Chapter Settings"
                >
                  <Icon icon="mdi:cog" className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
              {isTranslator && !isIndefinitelyLocked && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-[120px] whitespace-nowrap"
                  title="Edit Chapter"
                >
                  <span>Edit Chapter</span>
                </button>
              )}

            </div>
          </div>
        </div>
        
        {isEditing && isTranslator && !isIndefinitelyLocked ? (
          <TranslatorChapterEdit
            chapterId={chapterId}
            novelId={novelId}
            initialContent={content}
            initialTitle={title}
            initialAuthorThoughts={authorThoughts}
            onSave={() => {
              setIsEditing(false);
              // Refresh the page to show updated content
              window.location.reload();
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : isIndefinitelyLocked ? (
          <div className="text-center py-12">
            <Icon icon="mdi:clock-outline" className="text-6xl text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">This chapter is not yet available</p>
          </div>
        ) : (
          <>
            {!isMobile ? (
              <ScreenshotProtection>
                <div 
                  className="prose prose-sm md:prose-base max-w-2xl mx-auto text-black dark:text-white chapter-content select-none dark:prose-invert"
                  style={getTextStyles(fontFamily, fontSize)}
                >
                  {paragraphs.map((paragraph, index) => {
                    const paragraphId = `p-${index}`;
                    const paragraphComments = comments[paragraphId] || [];
                    
                    return (
                      <ChapterParagraph
                        key={`${chapterNumber}-${paragraphId}`}
                        paragraph={paragraph}
                        paragraphId={paragraphId}
                        index={index}
                        totalParagraphs={paragraphs.length}
                        selectedParagraphId={selectedParagraphId}
                        commentCount={paragraphComments.length}
                        onCommentClick={handleCommentClick}
                        hideComments={hideComments}
                      />
                    );
                  })}
                  
                  {/* Footnotes Section */}
                  {footnotes.length > 0 && (
                    <FootnotesList footnotes={footnotes} />
                  )}
                </div>
              </ScreenshotProtection>
            ) : (
              <div 
                className="prose prose-sm md:prose-base max-w-2xl mx-auto text-black dark:text-white chapter-content select-none dark:prose-invert"
                style={getTextStyles(fontFamily, fontSize)}
              >
                {paragraphs.map((paragraph, index) => {
                  const paragraphId = `p-${index}`;
                  const paragraphComments = comments[paragraphId] || [];
                  
                  return (
                    <ChapterParagraph
                      key={`${chapterNumber}-${paragraphId}`}
                      paragraph={paragraph}
                      paragraphId={paragraphId}
                      index={index}
                      totalParagraphs={paragraphs.length}
                      selectedParagraphId={selectedParagraphId}
                      commentCount={paragraphComments.length}
                      onCommentClick={handleCommentClick}
                      hideComments={hideComments}
                    />
                  );
                })}
                
                {/* Footnotes Section */}
                {footnotes.length > 0 && (
                  <FootnotesList footnotes={footnotes} />
                )}
              </div>
            )}
          </>
        )}

        {/* Author's Thoughts Section - Only show if not indefinitely locked */}
        {!isIndefinitelyLocked && authorThoughts && authorThoughts.trim() !== '' && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="relative mb-4">
                {/* Like Button - Absolute positioned */}
                <div className="absolute right-0 top-0">
                  <button
                    onClick={handleLikeClick}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      isLiked 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-muted-foreground hover:text-red-500'
                    }`}
                    title={isLiked ? 'Unlike chapter' : 'Like chapter'}
                  >
                    <Icon 
                      icon={isLiked ? "mdi:heart" : "mdi:heart-outline"} 
                      className="w-5 h-5" 
                    />
                    <span className="font-medium">{likeCount}</span>
                  </button>
                </div>

                {/* Author info with max-width to prevent overlap */}
                <div className="flex items-center gap-3 min-w-0 pr-24">
                  {authorProfile && (
                    <div className="flex-shrink-0">
                      {authorProfile.avatar_url ? (
                        <img
                          src={authorProfile.avatar_url}
                          alt={authorProfile.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = authorProfile.username[0]?.toUpperCase() || '?';
                              parent.className = "w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg";
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                          {authorProfile.username[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="relative">
                      <h3 
                        className="text-lg font-medium text-foreground whitespace-nowrap overflow-hidden hover:overflow-x-auto md:overflow-visible scrollbar-none group"
                        style={{
                          maxWidth: 'calc(100% - 8px)',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        <span className="inline-block min-w-fit touch-pan-x">
                          {authorProfile?.username}&apos;s words
                        </span>
                      </h3>
                      {/* Gradient fade effect */}
                      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-card pointer-events-none group-hover:opacity-0 transition-opacity md:hidden" />
                      {/* Scroll indicator */}
                      <div 
                        className="absolute -right-1 top-1/2 -translate-y-1/2 text-muted-foreground/50 cursor-pointer hover:text-muted-foreground transition-colors md:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nameElement = e.currentTarget.parentElement?.querySelector('span');
                          if (nameElement) {
                            nameElement.scrollTo({ left: nameElement.scrollWidth, behavior: 'smooth' });
                          }
                        }}
                      >
                        <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="prose prose-sm md:prose-base text-foreground dark:prose-invert mb-6"
                style={getTextStyles(fontFamily, fontSize - 1)}
                dangerouslySetInnerHTML={{ __html: formatText(filterExplicitContent(authorThoughts, !showProfanity)) }}
              />

              {authorProfile && (
                <TranslatorLinks
                  translator={{
                    username: authorProfile.username,
                    profile_id: authorId,
                    kofiUrl: authorProfile.kofiUrl,
                    patreonUrl: authorProfile.patreonUrl,
                    customUrl: authorProfile.customUrl,
                    customUrlLabel: authorProfile.customUrlLabel,
                    author_bio: authorProfile.author_bio
                  }}
                />
              )}
            </div>
          </div>
        )}

        {selectedParagraphId && !isIndefinitelyLocked && (
          <CommentPopover
            paragraphId={selectedParagraphId}
            comments={(comments[selectedParagraphId] || []).map(comment => ({
              ...comment,
              profile: comment.profile || { 
                username: null,
                avatar_url: undefined,
                id: comment.profile_id,
                role: 'USER' as const
              }
            } as ChapterCommentWithProfile))}
            onClose={handleCloseComment}
            onAddComment={(content) => handleAddComment(selectedParagraphId, content)}
            onDeleteComment={deleteComment}
            onUpdateComment={updateComment}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            userId={userId}
            novelId={novelId}
            authorId={authorId}
          />
        )}

        {/* Corner tab for settings (only visible on mobile and when ChapterBar is closed) */}
        {isMobile && !isIndefinitelyLocked && !isChapterBarVisible && (
          <div className="fixed bottom-0 right-0 z-50">
            {/* Settings Tab */}
            <button
              onClick={toggleChapterBar}
              className="bg-primary text-primary-foreground px-3 py-3 rounded-tl-2xl shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              aria-label="Open chapter settings"
            >
              <Icon icon="mdi:cog" className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 