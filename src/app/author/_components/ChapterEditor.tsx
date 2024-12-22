import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface ChapterEditorProps {
  value: string;
  onChange: (value: string) => void;
  authorThoughts: string;
  onAuthorThoughtsChange: (thoughts: string) => void;
  className?: string;
}

export const formatText = (text: string): string => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '');

  return lines.join('\n\n');
};

export default function ChapterEditor({ 
  value, 
  onChange, 
  authorThoughts,
  onAuthorThoughtsChange,
  className = '' 
}: ChapterEditorProps) {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = textareaRef.value.substring(start, end);
    
    const formatMap = {
      bold: { mark: '**', check: (text: string) => text.startsWith('**') && text.endsWith('**') },
      italic: { mark: '*', check: (text: string) => text.startsWith('*') && text.endsWith('*') && !(text.startsWith('**') && text.endsWith('**')) },
      underline: { mark: '_', check: (text: string) => text.startsWith('_') && text.endsWith('_') }
    };

    const { mark, check } = formatMap[format];
    let newText = '';
    let offset = 0;

    if (check(selectedText)) {
      newText = textareaRef.value.substring(0, start) + selectedText.slice(mark.length, -mark.length) + textareaRef.value.substring(end);
      offset = -mark.length * 2;
    } else {
      newText = textareaRef.value.substring(0, start) + `${mark}${selectedText}${mark}` + textareaRef.value.substring(end);
      offset = mark.length * 2;
    }

    onChange(newText);
    
    // Restore selection
    setTimeout(() => {
      if (selectedText) {
        textareaRef.selectionStart = start;
        textareaRef.selectionEnd = end + offset;
      } else {
        const cursorPos = start + Math.abs(offset) / 2;
        textareaRef.selectionStart = cursorPos;
        textareaRef.selectionEnd = cursorPos;
      }
      textareaRef.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting('underline');
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
      onChange(newText);
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
    setTimeout(() => {
      const newPosition = start + formattedText.length;
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-gray-50 border rounded-lg">
        <button
          onClick={() => applyFormatting('bold')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Icon icon="mdi:format-bold" className="w-5 h-5 text-black" />
        </button>
        <button
          onClick={() => applyFormatting('italic')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Icon icon="mdi:format-italic" className="w-5 h-5 text-black" />
        </button>
        <button
          onClick={() => applyFormatting('underline')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Underline (Ctrl+U)"
          type="button"
        >
          <Icon icon="mdi:format-underline" className="w-5 h-5 text-black" />
        </button>
        <div className="flex-1 text-right px-2">
          <span className="text-sm text-gray-500">
            {value.length} characters
          </span>
        </div>
      </div>

      {/* Editor Area */}
      <textarea
        ref={setTextareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={`w-full p-4 border rounded-lg text-black min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${className}`}
        placeholder="Write your chapter content here..."
      />

      {/* Author's Thoughts Section */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:thought-bubble" className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-700">Author&apos;s Thoughts</h3>
        </div>
        <textarea
          value={authorThoughts}
          onChange={(e) => onAuthorThoughtsChange(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg text-black min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-gray-50"
          placeholder="Share your thoughts about this chapter (only visible to you)..."
        />
      </div>
    </div>
  );
} 