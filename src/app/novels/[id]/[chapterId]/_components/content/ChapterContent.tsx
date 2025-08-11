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
import ScreenshotProtection from '../ScreenshotProtection';
import ChapterParagraph from './ChapterParagraph';
import TranslatorChapterEdit from './TranslatorChapterEdit';
import AuthorWords from './AuthorWords';

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
  hideAuthorWords?: boolean;
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
  hideAuthorWords = false,
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
  
  // Determine the display publication date
  const displayDate = publishAt || createdAt;

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
  // Preserve multiple blank lines by keeping empty segments and converting stray leading newlines
  const paragraphs = (() => {
    const raw = filterExplicitContent(content, !showProfanity);
    const parts = raw.split('\n\n');
    const expanded: string[] = [];
    for (let part of parts) {
      // If there are leftover leading single newlines (odd counts), convert each to an empty paragraph
      while (part.startsWith('\n')) {
        expanded.push('');
        part = part.slice(1);
      }
      expanded.push(part);
    }
    return expanded;
  })();

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
          
          // Smooth scroll to the footnote, accounting for the full page offset
          const yOffset = footnoteElement.getBoundingClientRect().top + window.scrollY - 100; // Add some space above
          window.scrollTo({
            top: yOffset,
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
          
          // Smooth scroll to the reference, accounting for the full page offset
          const yOffset = refElement.getBoundingClientRect().top + window.scrollY - 100; // Add some space above
          window.scrollTo({
            top: yOffset,
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
          
          const yOffset = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({
            top: yOffset,
            behavior: 'smooth'
          });
          
          element.classList.add('footnote-highlight');
          setTimeout(() => {
            element.classList.remove('footnote-highlight');
          }, 2000);
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

  // like logic moved into AuthorWords component

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
                {isIndefinitelyLocked ? 'Not yet available' : `Published ${formatDate(displayDate)}`}
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
        {!isIndefinitelyLocked && !hideAuthorWords && authorThoughts && authorThoughts.trim() !== '' && (
          <AuthorWords
            authorThoughts={authorThoughts}
            authorProfile={authorProfile}
            authorId={authorId}
            fontFamily={fontFamily}
            fontSize={fontSize}
            showProfanity={showProfanity}
            novelId={novelId}
            chapterNumber={chapterNumber}
          />
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