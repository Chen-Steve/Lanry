'use client';

import { useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import CommentPopover from '@/components/chapter/CommentBar';
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
  const { comments, addComment, isAuthenticated, isLoading } = useComments(novelId, chapterNumber);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleCloseComment = () => {
    setSelectedParagraphId(null);
    onCommentStateChange(false);
  };

  const handleAddComment = async (paragraphId: string, content: string) => {
    await addComment(paragraphId, content);
    setSelectedParagraphId(null);
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
        className="prose prose-sm md:prose-base max-w-2xl mx-auto text-black chapter-content"
        style={{ 
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`
        }}
      >
        {paragraphs.map((paragraph, index) => {
          const paragraphId = `p-${index}`;
          const paragraphComments = comments[paragraphId] || [];
          
          return (
            <div key={index} className="relative group">
              <div className="relative">
                <div 
                  id={paragraphId}
                  className={`mb-4 leading-relaxed cursor-pointer active:underline active:decoration-dashed active:decoration-gray-400 active:underline-offset-4 transition-all duration-200 
                    ${isMobile ? 'touch-action-none' : ''} 
                    ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 underline-offset-4' : ''}`}
                  style={isMobile ? {
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent'
                  } : undefined}
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
                  {paragraph}
                  <span className="inline-flex items-center">
                    {!isMobile && paragraphComments.length > 0 && (
                      <button
                        onClick={(e) => handleCommentClick(e, paragraphId)}
                        className="transition-colors duration-200 ml-1"
                        aria-label="View comments"
                      >
                        <Icon 
                          icon="pepicons-print:text-bubbles" 
                          className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors"
                        />
                      </button>
                    )}
                    {paragraphComments.length > 0 && (
                      <span className="text-sm text-blue-500 ml-1">
                        ({paragraphComments.length})
                      </span>
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
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          novelId={novelId}
        />
      )}
    </div>
  );
} 