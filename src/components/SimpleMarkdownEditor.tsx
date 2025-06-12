import { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import MarkdownPreview from '@/app/author/_components/MarkdownPreview'

interface SimpleMarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

type FormatType = 'bold' | 'italic' | 'underline' | 'link' | 'divider'

export default function SimpleMarkdownEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Write your message...',
  className = ''
}: SimpleMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPreview, setIsPreview] = useState(false)

  const applyFormatting = (format: FormatType) => {
    if (!textareaRef.current) return
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selected = textareaRef.current.value.substring(start, end)

    const map: Record<FormatType, { mark: string; wrap?: (sel: string) => string }> = {
      bold: { mark: '**' },
      italic: { mark: '*' },
      underline: { mark: '_' },
      link: {
        mark: '',
        wrap: (sel) => `[${sel || 'link text'}](url)`
      },
      divider: {
        mark: '',
        wrap: () => `---`
      }
    }

    const cfg = map[format]
    let newText: string
    if (cfg.wrap) {
      newText = textareaRef.current.value.substring(0, start) +
        cfg.wrap(selected) +
        textareaRef.current.value.substring(end)
    } else {
      // wrap with mark**selected**mark
      newText = textareaRef.current.value.substring(0, start) +
        `${cfg.mark}${selected}${cfg.mark}` +
        textareaRef.current.value.substring(end)
    }

    onChange(newText)
    // reposition cursor
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = start + (cfg.wrap ? cfg.wrap(selected).length : cfg.mark.length)
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos
        textareaRef.current.focus()
      }
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* toolbar */}
      <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-lg p-1">
        {(['bold', 'italic', 'underline', 'link', 'divider'] as FormatType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => applyFormatting(t)}
            className="p-1.5 hover:bg-accent/50 rounded transition-colors"
            disabled={disabled || isPreview}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
          >
            <Icon icon={
              t === 'bold' ? 'mdi:format-bold' :
              t === 'italic' ? 'mdi:format-italic' :
              t === 'underline' ? 'mdi:format-underline' :
              t === 'link' ? 'mdi:link' :
              'mdi:minus'
            } className="w-4 h-4" />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="p-1.5 hover:bg-accent/50 rounded transition-colors flex items-center gap-1"
          title={isPreview ? 'Edit' : 'Preview'}
        >
          <Icon icon={isPreview ? 'mdi:pencil' : 'mdi:eye'} className="w-4 h-4" />
        </button>
      </div>

      {isPreview ? (
        <MarkdownPreview content={value} className="border border-border rounded-lg p-3 bg-background" />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full min-h-[120px] p-3 border border-border rounded-lg bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
        />
      )}
    </div>
  )
} 