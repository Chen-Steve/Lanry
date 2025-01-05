import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface ChapterEditorProps {
  value: string;
  onChange: (value: string) => void;
  authorThoughts?: string;
  onAuthorThoughtsChange?: (thoughts: string) => void;
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

  type FormatType = 'bold' | 'italic' | 'underline' | 'footnote' | 'link' | 'divider';
  
  interface FormatConfig {
    mark: string;
    check: (text: string) => boolean;
    apply?: () => string;
  }

  const applyFormatting = (format: FormatType) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = textareaRef.value.substring(start, end);
    
    const formatMap: Record<FormatType, FormatConfig> = {
      bold: { mark: '**', check: (text: string) => text.startsWith('**') && text.endsWith('**') },
      italic: { mark: '*', check: (text: string) => text.startsWith('*') && text.endsWith('*') && !(text.startsWith('**') && text.endsWith('**')) },
      underline: { mark: '_', check: (text: string) => text.startsWith('_') && text.endsWith('_') },
      footnote: { 
        mark: '', 
        check: (text: string) => /\[\^\d+:.*?\]/.test(text),
        apply: () => {
          const footnotes = [...textareaRef.value.matchAll(/\[\^(\d+):/g)];
          const highestNumber = footnotes.length > 0 
            ? Math.max(...footnotes.map(match => parseInt(match[1])))
            : 0;
          const newNumber = highestNumber + 1;
          return `[^${newNumber}: ${selectedText || 'Enter footnote text'}]`;
        }
      },
      link: {
        mark: '',
        check: (text: string) => /\[.*?\]\(.*?\)/.test(text),
        apply: () => {
          return `[${selectedText || 'Enter link text'}](Enter URL)`;
        }
      },
      divider: {
        mark: '',
        check: (text: string) => text === '---',
        apply: () => {
          return '---';
        }
      }
    };

    const { mark, check, apply } = formatMap[format];
    let newText = '';
    let offset = 0;

    if (format === 'footnote' || format === 'link' || format === 'divider') {
      const formattedText = apply!();
      newText = textareaRef.value.substring(0, start) + formattedText + textareaRef.value.substring(end);
      offset = formattedText.length;
    } else if (check(selectedText)) {
      newText = textareaRef.value.substring(0, start) + selectedText.slice(mark.length, -mark.length) + textareaRef.value.substring(end);
      offset = -mark.length * 2;
    } else {
      newText = textareaRef.value.substring(0, start) + `${mark}${selectedText}${mark}` + textareaRef.value.substring(end);
      offset = mark.length * 2;
    }

    onChange(newText);
    
    setTimeout(() => {
      if (selectedText && format !== 'footnote' && format !== 'link' && format !== 'divider') {
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
        case 'f':
          e.preventDefault();
          applyFormatting('footnote');
          break;
        case 'k':
          e.preventDefault();
          applyFormatting('link');
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
    <div className="space-y-2 w-full">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 border rounded-lg">
        <button
          onClick={() => applyFormatting('bold')}
          className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Icon icon="mdi:format-bold" className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </button>
        <button
          onClick={() => applyFormatting('italic')}
          className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Icon icon="mdi:format-italic" className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </button>
        <button
          onClick={() => applyFormatting('underline')}
          className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Underline (Ctrl+U)"
          type="button"
        >
          <Icon icon="mdi:format-underline" className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </button>
        <button
          onClick={() => applyFormatting('footnote')}
          className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Add Footnote (Ctrl+F)"
          type="button"
        >
          <Icon icon="mdi:format-superscript" className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </button>
        <button
          onClick={() => applyFormatting('link')}
          className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Add Link (Ctrl+K)"
          type="button"
        >
          <Icon icon="mdi:link" className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </button>
        <div className="w-px h-4 md:h-5 bg-gray-300 mx-1" /> {/* Separator */}
        <button
          onClick={() => applyFormatting('divider')}
          className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Insert Horizontal Line"
          type="button"
        >
          <Icon icon="mdi:minus" className="w-4 h-4 md:w-5 md:h-5 text-black" />
        </button>
        <div className="flex-1 text-right px-2">
          <span className="text-xs md:text-sm text-gray-500">
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
        className={`w-full p-3 md:p-4 border rounded-lg text-black min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${className}`}
        placeholder="Write your chapter here..."
      />

      {/* Author's Thoughts Section */}
      {authorThoughts !== undefined && onAuthorThoughtsChange && (
        <div className="mt-4 md:mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:thought-bubble" className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            <h3 className="text-base md:text-lg font-medium text-gray-700">Author&apos;s Thoughts</h3>
          </div>
          <textarea
            value={authorThoughts}
            onChange={(e) => onAuthorThoughtsChange(e.target.value)}
            className="w-full p-3 md:p-4 border border-gray-300 rounded-lg text-black min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-gray-50"
            placeholder="Share your thoughts about this chapter (it will be visible at the bottom of the chapter)"
          />
        </div>
      )}
    </div>
  );
} 