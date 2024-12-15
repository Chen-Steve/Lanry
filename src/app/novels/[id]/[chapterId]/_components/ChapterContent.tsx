'use client';

import { useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { scrambleText, getTextStyles, getParagraphStyles, formatText } from '@/lib/textFormatting';
import CommentPopover from './CommentBar';
import { useComments } from '@/hooks/useComments';
import { Icon } from '@iconify/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ChapterContentProps {
  novelId: string;
  chapterNumber: number;
  title: string;
  createdAt: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  onCommentStateChange: (isOpen: boolean) => void;
}

export default function ChapterContent({
  novelId,
  chapterNumber,
  title,
  createdAt,
  content,
  fontFamily,
  fontSize,
  onCommentStateChange,
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
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-black">
            Chapter {chapterNumber}: {title}
          </h2>
          <p className="text-xs md:text-sm text-gray-600">
            Published {formatDate(createdAt)}
          </p>
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
                  className={`mb-4 leading-relaxed cursor-pointer active:underline active:decoration-dashed active:decoration-gray-400 active:underline-offset-4 transition-all duration-200 
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
                  <span aria-hidden="true" className="select-all invisible absolute">{scrambleText(paragraph)}</span>
                  <span className="relative" dangerouslySetInnerHTML={{ __html: formatText(paragraph) }} />
                  <span className="inline-flex items-center">
                    {!isMobile && paragraphComments.length > 0 && (
                      <button
                        onClick={(e) => handleCommentClick(e, paragraphId)}
                        className="transition-colors duration-200 ml-1 relative"
                        aria-label="View comments"
                      >
                        <Icon 
                          icon="bx:comment" 
                          className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors"
                        />
                        <span className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 hover:text-blue-500">
                          {paragraphComments.length}
                        </span>
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedParagraphId && (
        <CommentPopover
          paragraphId={selectedParagraphId}
          comments={(comments[selectedParagraphId] || []).map(comment => ({
            ...comment,
            profile: comment.profile || { username: 'Anonymous' }
          }))}
          onClose={handleCloseComment}
          onAddComment={(content) => handleAddComment(selectedParagraphId, content)}
          onDeleteComment={deleteComment}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          userId={userId}
          novelId={novelId}
        />
      )}
    </div>
  );
} 