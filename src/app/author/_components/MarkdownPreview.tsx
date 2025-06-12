import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const formatText = (text: string): string => {
    // Replace standalone Supabase image URLs with image elements (if any)
    text = text.replace(
      /(https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/footnote-images\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif))/g,
      '<img src="$1" alt="Footnote image" class="max-w-full h-auto rounded-lg my-2 hover:opacity-90 transition-opacity" style="max-height: 300px; object-fit: contain;" loading="lazy" />'
    );

    // Format footnotes
    const processFootnotes = (content: string): string => {
      // Process footnotes [^1: content]
      return content.replace(/\[\^(\d+):\s*([^\]]+)\]/g, (_, num, footnoteContent) => {
        // Format the footnote content first
        const formattedFootnoteContent = footnoteContent
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<u>$1</u>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">$1</a>');

        return `<span class="footnote-wrapper inline-block relative">
          <button type="button" 
            class="footnote inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" 
            data-footnote="${num}"
          ><sup>[${num}]</sup></button>
          <div class="footnote-tooltip opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute z-50 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg transition-all duration-200 text-sm text-foreground bottom-full mb-2 left-0">
            <div class="p-3 max-w-sm overflow-hidden">
              ${formattedFootnoteContent}
            </div>
            <div class="absolute bottom-[-6px] left-3 transform rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-border"></div>
          </div>
        </span>`;
      });
    };

    // First process footnotes
    text = processFootnotes(text);

    // Process spoiler boxes [spoiler]Content[/spoiler] or [spoiler=Title]Content[/spoiler]
    const processSpoilers = (content: string): string => {
      const simpleFormat = (inner: string): string => {
        return inner
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<u>$1</u>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (__, linkText, url) => {
            let safeUrl = url
            try {
              const u = new URL(url)
              if (!u.protocol.startsWith('http')) safeUrl = `https://${url}`
            } catch {
              safeUrl = `https://${url}`
            }
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">${linkText}</a>`
          })
      }

      return content.replace(/\[spoiler(?:=(.*?))?\]([\s\S]*?)\[\/spoiler\]/gi, (_m, title, spoilerContent) => {
        const spoilerTitle = title ? title.trim() : 'Spoiler'
        const formattedContent = simpleFormat(spoilerContent.trim())
        return `<details class="spoiler my-2">
  <summary class="cursor-pointer select-none bg-muted rounded p-2 text-foreground">${spoilerTitle}</summary>
  <div class="mt-2 border-l border-border pl-2">${formattedContent}</div>
</details>`
      })
    }

    text = processSpoilers(text);

    // Then process other formatting
    text = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/_(.*?)_/g, '<u>$1</u>') // Underline
      .replace(/^---$/gm, '<div class="border-t border-gray-300 dark:border-gray-700 leading-[1em] my-[1em]"></div>') // Horizontal rule
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
        // Ensure URL has proper protocol
        let safeUrl = url;
        try {
          const urlObj = new URL(url);
          if (!urlObj.protocol.startsWith('http')) {
            safeUrl = `https://${url}`;
          }
        } catch {
          safeUrl = `https://${url}`;
        }
        
        return `<a href="${safeUrl}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >${linkText}</a>`;
      });

    return text;
  };

  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <div key={index} className="relative group mb-4">
          <div 
            className="leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: formatText(paragraph) }} 
          />
        </div>
      ))}

      <style jsx global>{`
        .chapter-preview {
          font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
          font-size: 1.05rem;
          line-height: 1.8;
        }
        .footnote-wrapper:hover .footnote-tooltip {
          opacity: 1;
          visibility: visible;
        }
        .footnote-tooltip {
          width: 250px;
          pointer-events: none;
        }
        details.spoiler > summary::-webkit-details-marker {
          display: none;
        }
        details.spoiler > summary::after {
          content: '▼';
          float: right;
          transition: transform 0.2s ease;
        }
        details.spoiler[open] > summary::after {
          transform: rotate(-180deg);
        }
      `}</style>
    </div>
  );
} 