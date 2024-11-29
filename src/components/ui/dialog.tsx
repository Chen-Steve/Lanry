'use client';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">{children}</div>
    </div>
  ) : null;
}

export function DialogContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-md w-full ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function DialogTrigger({ 
  asChild, 
  children,
  onClick 
}: { 
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (asChild) {
    return <div onClick={onClick}>{children}</div>;
  }
  return <button onClick={onClick}>{children}</button>;
} 