'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { getTextStyles, formatText } from '@/lib/textFormatting';
import { filterExplicitContent } from '@/lib/contentFiltering';
import CommentPopover from '../interaction/comments/CommentBar';
import { useComments } from '@/hooks/useComments';
import { useChapterLikes } from '@/hooks/useChapterLikes';
import { Icon } from '@iconify/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ChapterComment as BaseChapterComment } from '@/types/database';
import FootnoteTooltip from './FootnoteTooltip';
import { toast } from 'react-hot-toast';
import ScreenshotProtection from '../ScreenshotProtection';
import ChapterParagraph from './ChapterParagraph';
import TranslatorChapterEdit from './TranslatorChapterEdit';
import Script from 'next/script';
import { TranslatorLinks } from '@/app/novels/[id]/_components/TranslatorLinks';

// Extend the base type to include avatar_url
interface ChapterComment extends Omit<BaseChapterComment, 'profile'> {
  profile?: {
    username: string | null;
    avatar_url?: string;
    id?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN';
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
  authorProfile?: {
    username: string;
    avatar_url?: string;
    role: 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'USER';
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
    author_bio?: string;
  };
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
  authorProfile
}: ChapterContentProps) {
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { comments, addComment, deleteComment, updateComment, isAuthenticated, isLoading, userId } = useComments(novelId, chapterNumber);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Check if the chapter is indefinitely locked
  const isIndefinitelyLocked = publishAt && new Date(publishAt).getFullYear() > new Date().getFullYear() + 50;

  const handleCloseComment = () => {
    setSelectedParagraphId(null);
    onCommentStateChange(false);
  };

  const handleAddComment = async (paragraphId: string, content: string) => {
    await addComment(paragraphId, content);
  };

  const handleParagraphClick = (e: React.MouseEvent<Element>, paragraphId: string) => {
    // If the click is on a footnote, don't open comments
    if ((e.target as Element).closest('.footnote')) {
      return;
    }
    
    if (!isMobile) {
      handleCommentClick(e, paragraphId);
    }
  };

  const handleParagraphLongPress = (
    event: React.TouchEvent<Element> | React.MouseEvent<Element>,
    paragraphId: string
  ) => {
    // If the long press is on a footnote, don't open comments
    if ((event.target as Element).closest('.footnote')) {
      return;
    }

    event.preventDefault();
    setSelectedParagraphId(paragraphId);
    onCommentStateChange(true);
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

  const paragraphs = filterExplicitContent(content)
    .split('\n\n')
    .filter(p => p.trim());

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

  const { likeCount, isLiked, toggleLike } = useChapterLikes({ 
    chapterNumber,
    novelId
  });

  const handleLikeClick = async () => {
    try {
      await toggleLike();
    } catch (error) {
      if (error instanceof Error && error.message === 'Must be logged in to like chapters') {
        toast.error('Please log in to like chapters');
      } else {
        toast.error('Failed to like chapter');
      }
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Ad Unit */}
      <div className="my-4">
        <div id="pf-13995-1">
          <Script
            id="pubfuture-ad"
            dangerouslySetInnerHTML={{
              __html: `window.pubfuturetag = window.pubfuturetag || [];
              window.pubfuturetag.push({unit: "67c7cde504d811003cdb4e14", id: "pf-13995-1"})`
            }}
          />
        </div>
      </div>

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
            </div>
            
            <div className="flex items-center gap-3">
              {isTranslator && !isIndefinitelyLocked && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  title="Edit Chapter"
                >
                  <Icon icon="mdi:pencil" className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Chapter</span>
                </button>
              )}
              {!isTranslator && !isMobile && !isIndefinitelyLocked && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Icon icon="mdi:gesture-tap-hold" className="w-4 h-4" />
                  <span>Hold text to comment</span>
                </div>
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
                        isMobile={isMobile}
                        onParagraphClick={handleParagraphClick}
                        onParagraphLongPress={handleParagraphLongPress}
                        onCommentClick={handleCommentClick}
                      />
                    );
                  })}
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
                      isMobile={isMobile}
                      onParagraphClick={handleParagraphClick}
                      onParagraphLongPress={handleParagraphLongPress}
                      onCommentClick={handleCommentClick}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Like Button Section */}
        {!isIndefinitelyLocked && (
          <div className="mt-8 max-w-2xl mx-auto flex justify-center">
            <button
              onClick={handleLikeClick}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
              title={isLiked ? 'Unlike chapter' : 'Like chapter'}
            >
              <Icon 
                icon={isLiked ? "mdi:heart" : "mdi:heart-outline"} 
                className="w-6 h-6" 
              />
              <span className="font-medium">{likeCount}</span>
            </button>
          </div>
        )}

        {/* Author's Thoughts Section - Only show if not indefinitely locked */}
        {!isIndefinitelyLocked && authorThoughts && authorThoughts.trim() !== '' && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
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
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                    {authorProfile?.username}&apos;s words
                  </h3>
                </div>
              </div>
              <div 
                className="prose prose-sm md:prose-base text-gray-700 dark:text-gray-300 dark:prose-invert mb-6"
                style={getTextStyles(fontFamily, fontSize - 1)}
                dangerouslySetInnerHTML={{ __html: formatText(filterExplicitContent(authorThoughts)) }}
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
            } as ChapterComment))}
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
        <FootnoteTooltip />
      </div>
    </div>
  );
} 