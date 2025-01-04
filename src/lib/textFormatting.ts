import type { CSSProperties } from 'react';

export const scrambleText = (text: string): string => {
  return text.split('').map(char => {
    if (/[\s\p{P}]/u.test(char)) return char;
    return String.fromCharCode(char.charCodeAt(0) + 0x1D5D4);
  }).join('');
};

export const formatText = (text: string): string => {
  // Replace **text** with <strong>text</strong> for bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace *text* with <em>text</em> for italics
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace _text_ with <u>text</u> for underline
  text = text.replace(/_(.*?)_/g, '<u>$1</u>');
  
  // Replace horizontal lines (---)
  text = text.replace(/^---$/gm, '<div class="border-t border-gray-300 leading-[1em] my-[1em]"></div>');
  
  // Replace [text](url) with <a> links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
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
    
    return `<span class="link-wrapper inline-block relative pointer-events-auto">
      <a href="${safeUrl}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        onclick="event.stopPropagation()"
      >${linkText}</a>
      <div class="link-preview opacity-0 invisible absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg transition-all duration-200 text-sm text-gray-700 dark:text-gray-200 pointer-events-none min-w-[200px] max-w-sm">
        <div class="flex items-start gap-2">
          <div>
            <div class="font-medium">${linkText}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 break-all">${safeUrl}</div>
          </div>
        </div>
      </div>
    </span>`;
  });
  
  // Replace [^number: content] with inline footnote popups
  text = text.replace(/\[\^(\d+):\s*(.*?)\]/g, (_match, num, content) => {
    console.log('Creating footnote:', { num, content });
    return `<span class="footnote-wrapper inline-block relative pointer-events-auto">
      <button type="button" 
        class="footnote inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" 
        data-footnote="${num}" 
        data-content="${content.replace(/"/g, '&quot;')}"
      ><sup>[${num}]</sup></button>
      <div class="footnote-tooltip opacity-0 invisible absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg transition-all duration-200 max-w-sm text-sm text-gray-700 dark:text-gray-200">
        ${content}
      </div>
    </span>`;
  });
  
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