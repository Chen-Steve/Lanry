import { Icon } from '@iconify/react';
import { scrambleText, getParagraphStyles, formatText } from '@/lib/textFormatting';

interface ChapterParagraphProps {
  paragraph: string;
  paragraphId: string;
  index: number;
  totalParagraphs: number;
  selectedParagraphId: string | null;
  commentCount: number;
  onCommentClick: (e: React.MouseEvent<Element>, paragraphId: string) => void;
  hideComments?: boolean;
}

export default function ChapterParagraph({
  paragraph,
  paragraphId,
  index,
  totalParagraphs,
  selectedParagraphId,
  commentCount,
  onCommentClick,
  hideComments = false,
}: ChapterParagraphProps) {
  return (
    <div className="relative group">
      <div className="relative">
        <div 
          id={paragraphId}
          className={`leading-relaxed 
            ${selectedParagraphId === paragraphId ? 'underline decoration-dashed decoration-gray-400 dark:decoration-gray-500 underline-offset-4' : ''}`}
          style={getParagraphStyles()}
        >
          <span aria-hidden="true" className="select-all invisible absolute">{scrambleText(paragraph)}</span>
          <span className="relative" dangerouslySetInnerHTML={{ __html: formatText(paragraph) }} />
          {!hideComments && (
            <span className="inline-flex items-center ml-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(e, paragraphId);
                }}
                className="transition-colors duration-200 relative"
                aria-label={commentCount > 0 ? "View comments" : "Add comment"}
              >
                <Icon 
                  icon={commentCount > 0 ? "bx:comment" : "bx:comment-add"} 
                  className={`w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
                />
                {commentCount > 0 && (
                  <span className={`absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400`}>
                    {commentCount}
                  </span>
                )}
              </button>
            </span>
          )}
        </div>
      </div>
      {index < totalParagraphs - 1 && <div className="mb-4"></div>}
    </div>
  );
} 