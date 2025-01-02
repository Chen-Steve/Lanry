'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { scrambleText, getTextStyles, getParagraphStyles, formatText } from '@/lib/textFormatting';
import CommentPopover from './CommentBar';
import { useComments } from '@/hooks/useComments';
import { Icon } from '@iconify/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ChapterComment as BaseChapterComment } from '@/types/database';

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
}: ChapterContentProps) {
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const { comments, addComment, deleteComment, isAuthenticated, isLoading, userId } = useComments(novelId, chapterNumber);
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
    // Use event delegation for footnote interactions
    const handleFootnoteInteraction = (e: Event) => {
      console.log('Footnote interaction:', e.type);
      
      const target = e.target as Element;
      const footnote = target.closest('.footnote');
      if (!footnote) {
        console.log('No footnote found in event target');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Found footnote:', {
        footnote,
        dataset: footnote.getAttribute('data-footnote'),
        content: footnote.getAttribute('data-content')
      });
      
      const wrapper = footnote.closest('.footnote-wrapper');
      if (!wrapper) {
        console.log('No wrapper found');
        return;
      }
      
      const tooltip = wrapper.querySelector('.footnote-tooltip') as HTMLElement;
      if (!tooltip) {
        console.log('No tooltip found');
        return;
      }

      if (e.type === 'click') {
        console.log('Processing click event');
        
        // Remove pinned class from all other tooltips
        document.querySelectorAll('.footnote-tooltip.pinned').forEach(t => {
          if (t !== tooltip) {
            console.log('Unpinning other tooltip');
            t.classList.remove('pinned', 'opacity-100', 'visible');
            t.classList.add('opacity-0', 'invisible');
          }
        });
        
        // Toggle pinned state for this tooltip
        const wasPinned = tooltip.classList.contains('pinned');
        console.log('Tooltip was pinned:', wasPinned);
        
        if (wasPinned) {
          console.log('Hiding tooltip');
          tooltip.classList.remove('pinned', 'opacity-100', 'visible');
          tooltip.classList.add('opacity-0', 'invisible');
        } else {
          console.log('Showing pinned tooltip');
          tooltip.classList.add('pinned', 'opacity-100', 'visible');
          tooltip.classList.remove('opacity-0', 'invisible');
          
          // Position the tooltip
          const rect = wrapper.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const spaceAbove = rect.top;
          const spaceBelow = viewportHeight - rect.bottom;
          
          console.log('Positioning tooltip:', {
            spaceAbove,
            spaceBelow,
            viewportHeight,
            rect
          });
          
          tooltip.style.minWidth = '200px';
          tooltip.style.left = '50%';
          tooltip.style.transform = 'translateX(-50%)';
          
          if (spaceBelow >= 100 || spaceBelow > spaceAbove) {
            console.log('Positioning below');
            tooltip.style.top = 'calc(100% + 5px)';
            tooltip.style.bottom = 'auto';
          } else {
            console.log('Positioning above');
            tooltip.style.bottom = 'calc(100% + 5px)';
            tooltip.style.top = 'auto';
          }
        }
      }
    };

    // Close pinned tooltips when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      console.log('Click outside check');
      const target = e.target as Element;
      const footnoteWrapper = target.closest('.footnote-wrapper');
      
      // If we have any pinned tooltips and we're clicking outside of any footnote wrapper
      if (!footnoteWrapper && document.querySelector('.footnote-tooltip.pinned')) {
        console.log('Closing all pinned tooltips');
        e.preventDefault();
        e.stopPropagation();
        
        document.querySelectorAll('.footnote-tooltip.pinned').forEach(tooltip => {
          tooltip.classList.remove('pinned', 'opacity-100', 'visible');
          tooltip.classList.add('opacity-0', 'invisible');
        });
      }
    };

    console.log('Setting up footnote event listeners');
    // Add event listeners
    document.addEventListener('click', handleFootnoteInteraction);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      console.log('Cleaning up footnote event listeners');
      document.removeEventListener('click', handleFootnoteInteraction);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []); // No dependencies needed since we're using event delegation

  return (
    <div className="mb-6 md:mb-8">
      <div className="mb-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-black">
              Chapter {chapterNumber}
              {partNumber && <span> Part {partNumber}</span>}
              {title && <span>: {title}</span>}
            </h2>
            <p className="text-xs md:text-sm text-gray-600">
              Published {formatDate(createdAt)}
            </p>
          </div>
          <div className="md:hidden text-xs text-gray-500 flex items-center gap-1">
            <Icon icon="mdi:gesture-tap-hold" className="w-4 h-4" />
            <span>Hold text to comment</span>
          </div>
        </div>
      </div>
      
      <div 
        className="prose prose-sm md:prose-base max-w-2xl mx-auto text-black chapter-content select-none"
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
                  className={`leading-relaxed cursor-pointer pointer-events-none active:underline active:decoration-dashed active:decoration-gray-400 active:underline-offset-4 transition-all duration-200 
                    ${isMobile ? 'touch-action-none' : ''} 
                    ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 underline-offset-4' : ''}`}
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
                        className={`transition-colors duration-200 ml-1 relative ${isMobile ? 'text-gray-400' : ''}`}
                        aria-label="View comments"
                      >
                        <Icon 
                          icon="bx:comment" 
                          className={`w-5 h-5 ${isMobile ? 'text-gray-400' : 'text-gray-400 hover:text-blue-500'} transition-colors`}
                        />
                        <span className={`absolute ${isMobile ? 'top-[45%]' : 'top-[40%]'} left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium ${isMobile ? 'text-gray-400' : 'text-gray-400 hover:text-blue-500'}`}>
                          {paragraphComments.length}
                        </span>
                      </button>
                    )}
                  </span>
                </div>
              </div>
              <div className="mb-4"></div>
            </div>
          );
        })}
      </div>

      {/* Author's Thoughts Section */}
      {authorThoughts && authorThoughts.trim() !== '' && (
        <div className="mt-12 max-w-2xl mx-auto border-t pt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="mdi:thought-bubble" className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-700">Author&apos;s Thoughts</h3>
            </div>
            <div 
              className="prose prose-sm md:prose-base text-gray-700"
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
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          userId={userId}
          novelId={novelId}
          authorId={authorId}
        />
      )}
    </div>
  );
} 