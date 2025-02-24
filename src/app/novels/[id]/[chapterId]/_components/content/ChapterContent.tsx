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

// Extend the base type to include avatar_url
interface ChapterComment extends Omit<BaseChapterComment, 'profile'> {
  profile?: {
    username: string | null;
    avatar_url?: string;
    id?: string;
    role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
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
}: ChapterContentProps) {
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { comments, addComment, deleteComment, updateComment, isAuthenticated, isLoading, userId } = useComments(novelId, chapterNumber);
  const isMobile = useMediaQuery('(max-width: 768px)');

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
      <div 
        className="prose dark:prose-invert max-w-none"
        style={{ 
          fontFamily,
          fontSize: `${fontSize}px`,
          // Add min-height based on content length to prevent layout shift
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
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Published {formatDate(createdAt)}
              </p>
            </div>
            {isTranslator && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4" />
                Edit Chapter
              </button>
            )}
            {!isTranslator && !isMobile && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Icon icon="mdi:gesture-tap-hold" className="w-4 h-4" />
                <span>Hold text to comment</span>
              </div>
            )}
          </div>
        </div>
        
        {isEditing && isTranslator ? (
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

                  {/* Like Button Section - Moved inside the prose div */}
                  <div className="flex justify-center items-center gap-3 mt-4 mb-8">
                    <button
                      onClick={handleLikeClick}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                      aria-label={isLiked ? 'Unlike chapter' : 'Like chapter'}
                    >
                      <Icon 
                        icon={isLiked ? "mdi:heart" : "mdi:heart-outline"} 
                        className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
                      </span>
                    </button>
                  </div>
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

                {/* Like Button Section - Moved inside the prose div */}
                <div className="flex justify-center items-center gap-3 mt-4 mb-8">
                  <button
                    onClick={handleLikeClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label={isLiked ? 'Unlike chapter' : 'Like chapter'}
                  >
                    <Icon 
                      icon={isLiked ? "mdi:heart" : "mdi:heart-outline"} 
                      className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Author's Thoughts Section */}
        {authorThoughts && authorThoughts.trim() !== '' && (
          <div className="mt-8 max-w-2xl mx-auto border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:thought-bubble" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Author&apos;s Thoughts</h3>
              </div>
              <div 
                className="prose prose-sm md:prose-base text-gray-700 dark:text-gray-300 dark:prose-invert"
                style={getTextStyles(fontFamily, fontSize - 1)}
                dangerouslySetInnerHTML={{ __html: formatText(filterExplicitContent(authorThoughts)) }}
              />
            </div>
          </div>
        )}

        {selectedParagraphId && (
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