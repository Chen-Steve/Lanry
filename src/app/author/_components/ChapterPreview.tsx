import React from 'react';
import { formatText, extractedFootnotes, ExtractedFootnote } from '@/lib/textFormatting';
import { filterExplicitContent } from '@/lib/contentFiltering';

interface ChapterPreviewProps {
  content: string;
  fontFamily?: string;
  fontSize?: number;
  showProfanity?: boolean;
}

export default function ChapterPreview({ 
  content, 
  fontFamily = 'Inter, system-ui, sans-serif',
  fontSize = 16,
  showProfanity = false 
}: ChapterPreviewProps) {
  const [footnotes, setFootnotes] = React.useState<ExtractedFootnote[]>([]);

  // Extract footnotes from content
  React.useEffect(() => {
    // Process the content to extract footnotes
    formatText(content, true);
    setFootnotes([...extractedFootnotes]);
  }, [content]);

  // Filter explicit content if needed
  const filteredContent = filterExplicitContent(content, !showProfanity);
  
  // Split content into paragraphs
  const paragraphs = filteredContent
    .split('\n\n')
    .filter(p => p.trim());

  return (
    <div className="max-w-2xl mx-auto">
      <div 
        className="prose prose-sm md:prose-base max-w-2xl mx-auto text-black dark:text-white chapter-content dark:prose-invert"
        style={{ 
          fontFamily,
          fontSize: `${fontSize}px`,
          lineHeight: '1.6'
        }}
      >
        {/* Display paragraphs */}
        {paragraphs.map((paragraph, index) => (
          <p 
            key={index} 
            className="mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: formatText(paragraph) 
            }}
          />
        ))}
        
        {/* Footnotes Section */}
        {footnotes.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Footnotes
            </h3>
            <div className="space-y-3">
              {footnotes.map((footnote) => (
                <div 
                  key={footnote.id}
                  id={footnote.id}
                  className="flex gap-3 text-sm"
                >
                  <span className="flex-shrink-0 text-primary font-medium">
                    [{footnote.number}]
                  </span>
                  <div 
                    className="flex-1"
                    dangerouslySetInnerHTML={{ __html: footnote.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
