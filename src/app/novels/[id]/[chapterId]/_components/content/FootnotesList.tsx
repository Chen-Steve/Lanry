import React from 'react';

interface FootnoteItem {
  id: string;
  number: string;
  content: string;
}

interface FootnotesListProps {
  footnotes: FootnoteItem[];
}

const FootnotesList: React.FC<FootnotesListProps> = ({ footnotes }) => {
  if (footnotes.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h3 className="text-lg font-semibold mb-4">Footnotes</h3>
      <div className="space-y-4">
        {footnotes.map((footnote) => (
          <div key={footnote.id} id={`footnote-${footnote.number}`} className="flex gap-3 items-baseline">
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
      </div>
    </div>
  );
};

export default FootnotesList; 