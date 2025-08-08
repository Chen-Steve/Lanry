import { formatText } from '@/lib/textFormatting';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const formattedContent = formatText(content);

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
}
