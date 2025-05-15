interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  noBorder?: boolean;
}

export function Textarea({ className = '', noBorder = false, ...props }: TextareaProps) {
  return (
    <textarea 
      className={`w-full p-2 ${!noBorder ? 'border border-gray-300' : ''} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
} 