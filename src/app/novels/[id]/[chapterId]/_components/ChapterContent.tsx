'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

interface FootnoteProps {
  number: number;
  content: string;
}

function Footnote({ number, content }: FootnoteProps) {
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={handleClick}
        className="text-xs text-gray-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
      >
        Note {number}
      </button>
      {isVisible && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full left-0 transform -translate-y-1
                     bg-white border border-gray-200 p-2 min-w-[200px] max-w-sm rounded"
        >
          <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
        </div>
      )}
    </div>
  );
}

interface ParagraphFootnotes {
  text: string;
  footnotes: { number: number; content: string; }[];
}

const extractFootnotes = (text: string): ParagraphFootnotes => {
  const footnotes: { number: number; content: string; }[] = [];
  const cleanText = text.replace(/\[\^(\d+):\s*([^\]]+)\]/g, (_, number, content) => {
    footnotes.push({ number: parseInt(number), content: content.trim() });
    return '';
  });
  return { text: cleanText.trim(), footnotes };
};

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

  const handleParagraphLongPress = (
    event: React.TouchEvent<Element> | React.MouseEvent<Element>,
    paragraphId: string
  ) => {
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
          const { text, footnotes } = extractFootnotes(paragraph);
          
          return (
            <div key={`${chapterNumber}-${paragraphId}`} className="relative group">
              <div className="relative">
                <div 
                  id={paragraphId}
                  className={`leading-relaxed cursor-pointer active:underline active:decoration-dashed active:decoration-gray-400 active:underline-offset-4 transition-all duration-200 
                    ${isMobile ? 'touch-action-none' : ''} 
                    ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 underline-offset-4' : ''}`}
                  style={getParagraphStyles()}
                  onClick={(e) => !isMobile && handleCommentClick(e, paragraphId)}
                  onContextMenu={(e) => isMobile && handleParagraphLongPress(e, paragraphId)}
                  onTouchStart={(e) => {
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
                  <span aria-hidden="true" className="select-all invisible absolute">{scrambleText(text)}</span>
                  <span className="relative" dangerouslySetInnerHTML={{ __html: formatText(text) }} />
                  <span className="inline-flex items-center">
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
                {footnotes.length > 0 && (
                  <div className="flex flex-wrap gap-2 -mt-1">
                    {footnotes.map((footnote) => (
                      <Footnote 
                        key={`footnote-${footnote.number}`} 
                        number={footnote.number} 
                        content={footnote.content} 
                      />
                    ))}
                  </div>
                )}
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