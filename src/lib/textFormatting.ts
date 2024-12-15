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