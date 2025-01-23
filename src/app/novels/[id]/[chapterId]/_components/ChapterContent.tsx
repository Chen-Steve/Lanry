'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { scrambleText, getTextStyles, getParagraphStyles, formatText } from '@/lib/textFormatting';
import CommentPopover from './CommentBar';
import { useComments } from '@/hooks/useComments';
import { useChapterLikes } from '@/hooks/useChapterLikes';
import { Icon } from '@iconify/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ChapterComment as BaseChapterComment } from '@/types/database';
import FootnoteTooltip from './FootnoteTooltip';
import { toast } from 'react-hot-toast';
import ScreenshotProtection from './ScreenshotProtection';

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
}: ChapterContentProps) {
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
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

  const paragraphs = content
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

  return (
    <div>
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
          <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Icon icon="mdi:gesture-tap-hold" className="w-4 h-4" />
            <span>Hold text to comment</span>
          </div>
        </div>
      </div>
      
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
                <div key={`${chapterNumber}-${paragraphId}`} className="relative group">
                  <div className="relative">
                    <div 
                      id={paragraphId}
                      className={`leading-relaxed cursor-pointer pointer-events-none active:underline active:decoration-dashed active:decoration-gray-400 dark:active:decoration-gray-500 active:underline-offset-4 transition-all duration-200 
                        ${isMobile ? 'touch-action-none' : ''} 
                        ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 dark:decoration-gray-500 underline-offset-4' : ''}`}
                      style={getParagraphStyles()}
                      onClick={(e) => handleParagraphClick(e, paragraphId)}
                      onContextMenu={(e) => isMobile && handleParagraphLongPress(e, paragraphId)}
                      onTouchStart={(e) => {
                        // If touching a footnote, don't start the long press timer
                        if ((e.target as Element).closest('.footnote')) {
                          return;
                        }

                        if (!isMobile) return;
                        
                        const timer = setTimeout(() => {
                          handleParagraphLongPress(e, paragraphId);
                        }, 500);
                        
                        const cleanup = () => {
                          clearTimeout(timer);
                          document.removeEventListener('touchend', cleanup);
                          document.removeEventListener('touchmove', cleanup);
                        };
                        
                        document.addEventListener('touchend', cleanup);
                        document.addEventListener('touchmove', cleanup);
                      }}
                    >
                      <span aria-hidden="true" className="select-all invisible absolute">{scrambleText(paragraph)}</span>
                      <span className="relative pointer-events-auto" dangerouslySetInnerHTML={{ __html: formatText(paragraph) }} />
                      <span className="inline-flex items-center pointer-events-auto">
                        {paragraphComments.length > 0 && (
                          <button
                            onClick={(e) => handleCommentClick(e, paragraphId)}
                            className={`transition-colors duration-200 ml-1 relative ${isMobile ? 'text-gray-400 dark:text-gray-500' : ''}`}
                            aria-label="View comments"
                          >
                            <Icon 
                              icon="bx:comment" 
                              className={`w-5 h-5 ${
                                isMobile 
                                  ? 'text-gray-400 dark:text-gray-500' 
                                  : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400'
                              } transition-colors`}
                            />
                            <span className={`absolute ${isMobile ? 'top-[45%]' : 'top-[40%]'} left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium ${
                              isMobile 
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400'
                            }`}>
                              {paragraphComments.length}
                            </span>
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                  {index < paragraphs.length - 1 && <div className="mb-4"></div>}
                </div>
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
              <div key={`${chapterNumber}-${paragraphId}`} className="relative group">
                <div className="relative">
                  <div 
                    id={paragraphId}
                    className={`leading-relaxed cursor-pointer pointer-events-none active:underline active:decoration-dashed active:decoration-gray-400 dark:active:decoration-gray-500 active:underline-offset-4 transition-all duration-200 
                      ${isMobile ? 'touch-action-none' : ''} 
                      ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 dark:decoration-gray-500 underline-offset-4' : ''}`}
                    style={getParagraphStyles()}
                    onClick={(e) => handleParagraphClick(e, paragraphId)}
                    onContextMenu={(e) => isMobile && handleParagraphLongPress(e, paragraphId)}
                    onTouchStart={(e) => {
                      // If touching a footnote, don't start the long press timer
                      if ((e.target as Element).closest('.footnote')) {
                        return;
                      }

                      if (!isMobile) return;
                      
                      const timer = setTimeout(() => {
                        handleParagraphLongPress(e, paragraphId);
                      }, 500);
                      
                      const cleanup = () => {
                        clearTimeout(timer);
                        document.removeEventListener('touchend', cleanup);
                        document.removeEventListener('touchmove', cleanup);
                      };
                      
                      document.addEventListener('touchend', cleanup);
                      document.addEventListener('touchmove', cleanup);
                    }}
                  >
                    <span aria-hidden="true" className="select-all invisible absolute">{scrambleText(paragraph)}</span>
                    <span className="relative pointer-events-auto" dangerouslySetInnerHTML={{ __html: formatText(paragraph) }} />
                    <span className="inline-flex items-center pointer-events-auto">
                      {paragraphComments.length > 0 && (
                        <button
                          onClick={(e) => handleCommentClick(e, paragraphId)}
                          className={`transition-colors duration-200 ml-1 relative ${isMobile ? 'text-gray-400 dark:text-gray-500' : ''}`}
                          aria-label="View comments"
                        >
                          <Icon 
                            icon="bx:comment" 
                            className={`w-5 h-5 ${
                              isMobile 
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400'
                            } transition-colors`}
                          />
                          <span className={`absolute ${isMobile ? 'top-[45%]' : 'top-[40%]'} left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium ${
                            isMobile 
                              ? 'text-gray-400 dark:text-gray-500' 
                              : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400'
                          }`}>
                            {paragraphComments.length}
                          </span>
                        </button>
                      )}
                    </span>
                  </div>
                </div>
                {index < paragraphs.length - 1 && <div className="mb-4"></div>}
              </div>
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
              dangerouslySetInnerHTML={{ __html: formatText(authorThoughts) }}
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
  );
} 