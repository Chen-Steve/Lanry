'use client';

import { useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import CommentPopover from '@/components/chapter/CommentPopover';
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
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
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
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in event 
      ? event.touches[0].clientX 
      : (event as React.MouseEvent).clientX;

    setCommentPosition({
      x: clientX,
      y: rect.bottom
    });
    
    setSelectedParagraphId(paragraphId);
    onCommentStateChange(true);
  };

  const handleCommentClick = useCallback((
    event: React.MouseEvent<HTMLButtonElement>,
    paragraphId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setCommentPosition({
      x: event.clientX,
      y: rect.bottom
    });
    
    setSelectedParagraphId(paragraphId);
    onCommentStateChange(true);
  }, [onCommentStateChange]);

  return (
    <div className="mb-6 md:mb-8">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-black">
            Chapter {chapterNumber}: {title}
          </h2>
          <p className="text-xs md:text-sm text-black">
            Published {formatDate(createdAt)}
          </p>
        </div>
      </div>
      
      <div 
        className="prose prose-sm md:prose-base max-w-none text-black"
        style={{ 
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`
        }}
      >
        {content.split('\n').map((paragraph, index) => {
          const paragraphId = `p-${index}`;
          const paragraphComments = comments[paragraphId] || [];
          
          return (
            <div key={index} className="relative group">
              <p 
                id={paragraphId}
                className="mb-4 leading-relaxed relative"
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
                {!isMobile && (
                  <button
                    onClick={(e) => handleCommentClick(e, paragraphId)}
                    className="absolute left-[-30px] top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Add comment"
                  >
                    <Icon 
                      icon="pepicons-print:text-bubbles" 
                      className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors"
                    />
                  </button>
                )}
                {paragraphComments.length > 0 && (
                  <span className="ml-2 text-sm text-blue-500">
                    ({paragraphComments.length})
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {selectedParagraphId && (
        <CommentPopover
          position={commentPosition}
          paragraphId={selectedParagraphId}
          comments={comments[selectedParagraphId] || []}
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