'use client'
interface AvatarProps {
  src: string | null
  username: string
  size?: number
  className?: string
}

export function Avatar({ src, username, size = 40, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={username}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.remove();
        }}
      />
    );
  }

  return (
    <div className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center ${className}`}>
      {username.charAt(0).toUpperCase()}
    </div>
  );
} 