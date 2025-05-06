import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import FootnoteImageUploader from './FootnoteImageUploader';
import MarkdownPreview from './MarkdownPreview';

interface ChapterEditorProps {
  value: string;
  onChange: (value: string) => void;
  authorThoughts?: string;
  onAuthorThoughtsChange?: (thoughts: string) => void;
  className?: string;
  userId: string;
}

export const formatText = (text: string): string => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '');

  return lines.join('\n\n');
};

const getWordCount = (text: string): number => {
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export default function ChapterEditor({ 
  value, 
  onChange, 
  authorThoughts,
  onAuthorThoughtsChange,
  className = '',
  userId
}: ChapterEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  type FormatType = 'bold' | 'italic' | 'underline' | 'footnote' | 'link' | 'divider';
  
  interface FormatConfig {
    mark: string;
    check: (text: string) => boolean;
    apply?: () => string;
  }

  const applyFormatting = (format: FormatType) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = textareaRef.current.value.substring(start, end);
    
    const formatMap: Record<FormatType, FormatConfig> = {
      bold: { mark: '**', check: (text: string) => text.startsWith('**') && text.endsWith('**') },
      italic: { mark: '*', check: (text: string) => text.startsWith('*') && text.endsWith('*') && !(text.startsWith('**') && text.endsWith('**')) },
      underline: { mark: '_', check: (text: string) => text.startsWith('_') && text.endsWith('_') },
      footnote: { 
        mark: '', 
        check: (text: string) => /\[\^\d+:.*?\]/.test(text),
        apply: () => {
          if (!textareaRef.current) return '';
          const footnotes = [...textareaRef.current.value.matchAll(/\[\^(\d+):/g)];
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
      newText = textareaRef.current.value.substring(0, start) + formattedText + textareaRef.current.value.substring(end);
      offset = formattedText.length;
    } else if (check(selectedText)) {
      newText = textareaRef.current.value.substring(0, start) + selectedText.slice(mark.length, -mark.length) + textareaRef.current.value.substring(end);
      offset = -mark.length * 2;
    } else {
      newText = textareaRef.current.value.substring(0, start) + `${mark}${selectedText}${mark}` + textareaRef.current.value.substring(end);
      offset = mark.length * 2;
    }

    onChange(newText);
    
    setTimeout(() => {
      if (!textareaRef.current) return;
      
      if (selectedText && format !== 'footnote' && format !== 'link' && format !== 'divider') {
        textareaRef.current.selectionStart = start;
        textareaRef.current.selectionEnd = end + offset;
      } else {
        const cursorPos = start + Math.abs(offset) / 2;
        textareaRef.current.selectionStart = cursorPos;
        textareaRef.current.selectionEnd = cursorPos;
      }
      textareaRef.current.focus();
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

  const handleImageUploaded = (imageUrl: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    // Insert the image URL directly
    const newText = textareaRef.current.value.substring(0, start) + imageUrl + textareaRef.current.value.substring(end);
    onChange(newText);

    // Set cursor position after the inserted URL
    setTimeout(() => {
      if (!textareaRef.current) return;
      
      const newPosition = start + imageUrl.length;
      textareaRef.current.selectionStart = newPosition;
      textareaRef.current.selectionEnd = newPosition;
      textareaRef.current.focus();
    }, 0);
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className={`${className.includes('flex-1') ? 'flex flex-col h-full' : 'space-y-2'} w-full`}>
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-muted border border-border rounded-lg">
        {!isPreviewMode && (
          <>
            <button
              onClick={() => applyFormatting('bold')}
              className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
              title="Bold (Ctrl+B)"
              type="button"
            >
              <Icon icon="mdi:format-bold" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
              title="Italic (Ctrl+I)"
              type="button"
            >
              <Icon icon="mdi:format-italic" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
              title="Underline (Ctrl+U)"
              type="button"
            >
              <Icon icon="mdi:format-underline" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </button>
            <button
              onClick={() => applyFormatting('footnote')}
              className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
              title="Add Footnote (Ctrl+F)"
              type="button"
            >
              <Icon icon="mdi:format-superscript" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </button>
            <button
              onClick={() => applyFormatting('link')}
              className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
              title="Add Link (Ctrl+K)"
              type="button"
            >
              <Icon icon="mdi:link" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </button>
            <FootnoteImageUploader userId={userId} onImageUploaded={handleImageUploaded} />
            <div className="w-px h-4 md:h-5 bg-border mx-1" /> {/* Separator */}
            <button
              onClick={() => applyFormatting('divider')}
              className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
              title="Insert Horizontal Line"
              type="button"
            >
              <Icon icon="mdi:minus" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </button>
          </>
        )}
        
        {/* Preview toggle button - always visible */}
        <div className="w-px h-4 md:h-5 bg-border mx-1" /> {/* Separator */}
        <button
          onClick={togglePreviewMode}
          className={`p-1.5 md:p-2 ${isPreviewMode ? 'bg-primary/20 text-primary' : 'hover:bg-accent/50'} rounded-lg transition-colors flex items-center gap-1`}
          title={isPreviewMode ? "Switch to Editor" : "Preview Chapter"}
          type="button"
        >
          <Icon 
            icon={isPreviewMode ? "mdi:pencil" : "mdi:eye"} 
            className="w-4 h-4 md:w-5 md:h-5" 
          />
          <span className="text-xs md:text-sm font-medium hidden sm:inline-block">
            {isPreviewMode ? "Edit" : "Preview"}
          </span>
        </button>
        
        <div className="flex-1 text-right px-2 mr-8">
          <span className="text-xs md:text-sm text-muted-foreground">
            {getWordCount(value)} words
          </span>
        </div>
      </div>

      {/* Content Area - Editor or Preview */}
      <div className={`${className.includes('flex-1') ? 'flex-1 relative' : ''}`}>
        {isPreviewMode ? (
          <div className={`border border-border rounded-lg bg-background ${className.includes('flex-1') ? 'absolute inset-0 overflow-auto' : 'min-h-[300px] overflow-auto'}`}>
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white mb-6">
                Chapter Preview
              </h2>
              <MarkdownPreview content={value} />
            </div>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className={`w-full p-3 md:p-4 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-background placeholder:text-muted-foreground ${
                className.includes('flex-1') ? 'flex-1 absolute inset-0' : 'min-h-[400px] resize-y'
              }`}
              placeholder="Write your chapter here... (Ctrl or ⌘+B: Bold, Ctrl or ⌘+I: Italic, Ctrl or ⌘+U: Underline, Ctrl or ⌘+F: Footnote, Ctrl or ⌘+K: Link)"
              style={className.includes('flex-1') ? { resize: 'none' } : undefined}
            />

            {/* Author's Thoughts Section */}
            {authorThoughts !== undefined && onAuthorThoughtsChange && !className.includes('flex-1') && (
              <div className="mt-4 md:mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:thought-bubble" className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <h3 className="text-base md:text-lg font-medium text-foreground">Your Thoughts</h3>
                </div>
                <textarea
                  value={authorThoughts}
                  onChange={(e) => onAuthorThoughtsChange(e.target.value)}
                  className="w-full p-3 md:p-4 border border-border rounded-lg text-foreground min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary resize-y bg-background placeholder:text-muted-foreground"
                  placeholder="Share your thoughts about this chapter (it will be visible at the bottom of the chapter)"
                />
                {/* Save as default checkbox */}
                <SaveDefaultThoughtsCheckbox authorThoughts={authorThoughts} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SaveDefaultThoughtsCheckbox({ authorThoughts }: { authorThoughts: string }) {
  const [defaultThoughts, setDefaultThoughts] = React.useState<string | null>(null);
  const isChecked = defaultThoughts === authorThoughts && authorThoughts !== '';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setDefaultThoughts(localStorage.getItem('defaultAuthorThoughts'));
    }
  }, [authorThoughts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === 'undefined') return;
    if (e.target.checked) {
      localStorage.setItem('defaultAuthorThoughts', authorThoughts);
      setDefaultThoughts(authorThoughts);
    } else {
      localStorage.removeItem('defaultAuthorThoughts');
      setDefaultThoughts(null);
    }
  };

  return (
    <label className="flex items-center gap-2 mt-2 select-none cursor-pointer text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="accent-primary"
      />
      Save as default for new chapters
    </label>
  );
} 