import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface FootnoteItem {
  id: string;
  number: string;
  content: string;
}

interface FootnotesListProps {
  footnotes: FootnoteItem[];
}

const FootnotesList: React.FC<FootnotesListProps> = ({ footnotes }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (footnotes.length === 0) return null;
  
  // Number of footnotes to show when collapsed
  const initialFootnotesCount = 3;
  
  // Whether we need to show the expand/collapse toggle
  const hasMoreFootnotes = footnotes.length > initialFootnotesCount;
  
  // The footnotes to display based on current state
  const displayedFootnotes = expanded 
    ? footnotes 
    : footnotes.slice(0, initialFootnotesCount);
    
  // Number of hidden footnotes
  const hiddenCount = footnotes.length - initialFootnotesCount;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h3 className="text-lg font-semibold mb-4">Footnotes</h3>
      <div className="space-y-4" id="footnotes-container">
        {displayedFootnotes.map((footnote) => (
          <div 
            key={footnote.id} 
            id={`footnote-${footnote.number}`} 
            className="flex gap-3 items-baseline animate-in fade-in-50 duration-300"
          >
            <div className="flex-shrink-0 w-7 text-right">
              <a 
                href={`#footnote-ref-${footnote.number}`}
                className="inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                aria-label={`Return to reference ${footnote.number}`}
                data-back-to-ref={footnote.number}
              >
                [{footnote.number}]
              </a>
            </div>
            <div 
              className="text-sm text-foreground flex-1"
              dangerouslySetInnerHTML={{ __html: footnote.content }}
            />
          </div>
        ))}
        
        {hasMoreFootnotes && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#faf7f2] dark:bg-zinc-800 border border-border hover:bg-accent/50 transition-all text-sm font-medium group"
            >
              <Icon 
                icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
                className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors"
              />
              <span>
                {expanded 
                  ? "Show fewer footnotes" 
                  : `Show ${hiddenCount} more footnote${hiddenCount > 1 ? 's' : ''}`
                }
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FootnotesList; 