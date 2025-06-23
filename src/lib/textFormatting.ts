import type { CSSProperties } from 'react';

export const scrambleText = (text: string): string => {
  return text.split('').map(char => {
    if (/[\s\p{P}]/u.test(char)) return char;
    return String.fromCharCode(char.charCodeAt(0) + 0x1D5D4);
  }).join('');
};

// New type to track extracted footnotes
export interface ExtractedFootnote {
  id: string;
  number: string;
  content: string;
}

// Track footnotes globally during formatting process
export const extractedFootnotes: ExtractedFootnote[] = [];

export const formatText = (text: string, extractFootnotes = false): string => {
  // Clear the footnotes array if we're extracting them
  if (extractFootnotes) {
    extractedFootnotes.length = 0;
  }

  // Replace standalone Supabase image URLs with image elements
  text = text.replace(
    /(https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/footnote-images\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif))/g,
    '<img src="$1" alt="Footnote image" class="max-w-full h-auto rounded-lg my-2 hover:opacity-90 transition-opacity" style="max-height: 300px; object-fit: contain;" loading="lazy" />'
  );

  // Helper function to format content with all styling except footnotes
  const formatContent = (content: string): string => {
    // Replace **text** with <strong>text</strong> for bold
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace horizontal lines (--- or ***) FIRST to avoid conflict with italic formatting
    content = content.replace(/^\s*(?:-{3}|\*{3})\s*$/gm, '<div class="border-t border-gray-300 leading-[1em] my-[1em]"></div>');
    
    // Replace *text* with <em>text</em> for italics (ensure at least one non-asterisk character inside)
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Replace _text_ with <u>text</u> for underline
    content = content.replace(/_([^_]+)_/g, '<u>$1</u>');
    
    // Replace [text](url) with <a> links - using non-greedy match and balanced brackets
    content = content.replace(/\[([^\[\]]+)\]\(([^()]+)\)/g, (_match, linkText, url) => {
      // Validate URL
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
        onclick="event.stopPropagation()"
      >${linkText}</a>`;
    });

    return content;
  };

  // Helper function to find matching closing bracket
  const findClosingBracket = (text: string, startIndex: number): number => {
    let depth = 1;
    let i = startIndex;
    
    while (i < text.length && depth > 0) {
      if (text[i] === '[') depth++;
      if (text[i] === ']') depth--;
      i++;
    }
    
    return depth === 0 ? i - 1 : -1;
  };

  // Replace [^number: content] with footnote links that navigate to footnote section
  let lastIndex = 0;
  let result = '';
  
  // Find all footnotes and process them
  const footnoteRegex = /\[\^(\d+):/g;
  let match;
  
  while ((match = footnoteRegex.exec(text)) !== null) {
    const [fullMatch, num] = match;
    const startIndex = match.index;
    const startContent = startIndex + fullMatch.length;
    const endIndex = findClosingBracket(text, startContent);
    
    if (endIndex === -1) continue; // Skip if no matching closing bracket found
    
    // Add text before the footnote
    result += text.substring(lastIndex, startIndex);
    
    // Get and format the footnote content
    const content = text.substring(startContent, endIndex).trim();
    const formattedContent = formatContent(content);
    
    // Create a unique ID for this footnote (using just the number for consistent reference)
    const footnoteId = `footnote-${num}`;
    
    // Store the footnote for later use if extracting
    if (extractFootnotes) {
      extractedFootnotes.push({
        id: footnoteId,
        number: num,
        content: formattedContent
      });
    }
    
    // Add the formatted footnote reference
    result += `<a 
      id="footnote-ref-${num}" 
      href="#footnote-${num}" 
      class="inline-block text-primary hover:text-primary/80 transition-colors"
      data-footnote-ref="${num}"
    ><sup>[${num}]</sup></a>`;
    
    lastIndex = endIndex + 1;
  }
  
  // Add any remaining text
  result += text.substring(lastIndex);
  
  // Format the remaining content (outside of footnotes)
  text = formatContent(result);
  
  return text;
};

export const getTextStyles = (fontFamily: string, fontSize: number): CSSProperties => ({
  fontFamily,
  fontSize: `${fontSize}px`,
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
});

export const getParagraphStyles = (): CSSProperties => ({
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent'
}); 