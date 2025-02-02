import { Icon } from '@iconify/react';
import { scrambleText, getParagraphStyles, formatText } from '@/lib/textFormatting';

interface ChapterParagraphProps {
  paragraph: string;
  paragraphId: string;
  index: number;
  totalParagraphs: number;
  selectedParagraphId: string | null;
  commentCount: number;
  isMobile: boolean;
  onParagraphClick: (e: React.MouseEvent<Element>, paragraphId: string) => void;
  onParagraphLongPress: (e: React.TouchEvent<Element> | React.MouseEvent<Element>, paragraphId: string) => void;
  onCommentClick: (e: React.MouseEvent<Element>, paragraphId: string) => void;
}

export default function ChapterParagraph({
  paragraph,
  paragraphId,
  index,
  totalParagraphs,
  selectedParagraphId,
  commentCount,
  isMobile,
  onParagraphClick,
  onParagraphLongPress,
  onCommentClick,
}: ChapterParagraphProps) {
  return (
    <div className="relative group">
      <div className="relative">
        <div 
          id={paragraphId}
          className={`leading-relaxed cursor-pointer pointer-events-none active:underline active:decoration-dashed active:decoration-gray-400 dark:active:decoration-gray-500 active:underline-offset-4 transition-all duration-200 
            ${isMobile ? 'touch-action-none' : ''} 
            ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 dark:decoration-gray-500 underline-offset-4' : ''}`}
          style={getParagraphStyles()}
          onClick={(e) => onParagraphClick(e, paragraphId)}
          onContextMenu={(e) => isMobile && onParagraphLongPress(e, paragraphId)}
          onTouchStart={(e) => {
            // If touching a footnote, don't start the long press timer
            if ((e.target as Element).closest('.footnote')) {
              return;
            }

            if (!isMobile) return;
            
            const timer = setTimeout(() => {
              onParagraphLongPress(e, paragraphId);
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
            {commentCount > 0 && (
              <button
                onClick={(e) => onCommentClick(e, paragraphId)}
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
                  {commentCount}
                </span>
              </button>
            )}
          </span>
        </div>
      </div>
      {index < totalParagraphs - 1 && <div className="mb-4"></div>}
    </div>
  );
} 