'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import CommentPopover from '@/components/chapter/CommentPopover';
import { useComments } from '@/hooks/useComments';
import { Icon } from '@iconify/react';

interface ChapterContentProps {
  chapterNumber: number;
  title: string;
  createdAt: string;
  content: string;
  fontFamily: string;
  fontSize: number;
}

export default function ChapterContent({
  chapterNumber,
  title,
  createdAt,
  content,
  fontFamily,
  fontSize
}: ChapterContentProps) {
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const { comments, addComment, isAuthenticated, isLoading } = useComments(chapterNumber);

  const handleParagraphLongPress = (
    event: React.TouchEvent<Element> | React.MouseEvent<Element>,
    paragraphId: string
  ) => {
    event.preventDefault();
    
    // Calculate position for comment popover
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in event 
      ? event.touches[0].clientX 
      : (event as React.MouseEvent).clientX;

    setCommentPosition({
      x: clientX,
      y: rect.bottom
    });
    
    setSelectedParagraphId(paragraphId);
  };

  const handleCloseComment = () => {
    setSelectedParagraphId(null);
  };

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
                onContextMenu={(e) => handleParagraphLongPress(e, paragraphId)}
                onTouchStart={(e) => {
                  const timer = setTimeout(() => {
                    handleParagraphLongPress(e, paragraphId);
                  }, 500);
                  
                  const cleanup = () => {
                    clearTimeout(timer);
                    document.removeEventListener('touchend', cleanup);
                  };
                  
                  document.addEventListener('touchend', cleanup);
                }}
              >
                {paragraph}
                {paragraphComments.length > 0 && (
                  <span className="ml-2 text-sm text-blue-500">
                    ({paragraphComments.length})
                  </span>
                )}
              </p>
              
              {/* Comment indicator */}
              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleParagraphLongPress(e, paragraphId)}
                  className="text-gray-400 hover:text-blue-500"
                  aria-label="Add comment"
                >
                  <Icon 
                    icon="pepicons-print:text-bubbles" 
                    className="w-6 h-6 [stroke-width:2px]"
                    width={24}
                    height={24}
                  />
                </button>
              </div>
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
          onAddComment={(content) => addComment(selectedParagraphId, content)}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 