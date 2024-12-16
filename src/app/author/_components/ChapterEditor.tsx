import React from 'react';

interface ChapterEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const formatText = (text: string): string => {
  // Split into lines and clean each line
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '');

  // Simply join non-empty lines with double newlines
  return lines.join('\n\n');
};

export default function ChapterEditor({ value, onChange, className = '' }: ChapterEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey) {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      let newText = '';
      let offset = 0;
      
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
            newText = textarea.value.substring(0, start) + selectedText.slice(2, -2) + textarea.value.substring(end);
            offset = -4;
          } else {
            newText = textarea.value.substring(0, start) + `**${selectedText}**` + textarea.value.substring(end);
            offset = 4;
          }
          break;
        case 'i':
          e.preventDefault();
          if (selectedText.startsWith('*') && selectedText.endsWith('*') && 
              !(selectedText.startsWith('**') && selectedText.endsWith('**'))) {
            newText = textarea.value.substring(0, start) + selectedText.slice(1, -1) + textarea.value.substring(end);
            offset = -2;
          } else {
            newText = textarea.value.substring(0, start) + `*${selectedText}*` + textarea.value.substring(end);
            offset = 2;
          }
          break;
        case 'u':
          e.preventDefault();
          if (selectedText.startsWith('_') && selectedText.endsWith('_')) {
            newText = textarea.value.substring(0, start) + selectedText.slice(1, -1) + textarea.value.substring(end);
            offset = -2;
          } else {
            newText = textarea.value.substring(0, start) + `_${selectedText}_` + textarea.value.substring(end);
            offset = 2;
          }
          break;
      }
      
      if (newText) {
        onChange(newText);
        // Set cursor position after the formatting is applied
        setTimeout(() => {
          if (selectedText) {
            textarea.selectionStart = start;
            textarea.selectionEnd = end + offset;
          } else {
            const cursorPos = start + Math.abs(offset) / 2;
            textarea.selectionStart = cursorPos;
            textarea.selectionEnd = cursorPos;
          }
          textarea.focus();
        }, 0);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
      onChange(newText);
      // Set cursor position after the newline
      setTimeout(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1;
        textarea.focus();
      }, 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const pastedText = e.clipboardData.getData('text');
    const formattedText = formatText(pastedText);
    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    onChange(newText);
    // Set cursor position after the pasted text
    setTimeout(() => {
      const newPosition = start + formattedText.length;
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
      textarea.focus();
    }, 0);
  };

  return (
    <textarea
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`w-full p-3 border rounded-lg min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      placeholder="Chapter content (Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline)"
    />
  );
} 