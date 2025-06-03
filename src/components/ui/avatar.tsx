'use client'

// Predefined cloudy gradients
const CLOUDY_GRADIENTS = [
  'bg-gradient-to-br from-rose-200/80 via-rose-300/70 to-pink-400/60 text-rose-900',
  'bg-gradient-to-br from-amber-200/80 via-orange-300/70 to-yellow-400/60 text-amber-900',
  'bg-gradient-to-br from-emerald-200/80 via-green-300/70 to-teal-400/60 text-emerald-900',
  'bg-gradient-to-br from-sky-200/80 via-blue-300/70 to-cyan-400/60 text-sky-900',
  'bg-gradient-to-br from-blue-200/80 via-indigo-300/70 to-violet-400/60 text-blue-900',
  'bg-gradient-to-br from-purple-200/80 via-violet-300/70 to-fuchsia-400/60 text-purple-900',
  'bg-gradient-to-br from-pink-200/80 via-rose-300/70 to-purple-400/60 text-pink-900',
  'bg-gradient-to-br from-indigo-200/80 via-blue-300/70 to-sky-400/60 text-indigo-900',
];

interface AvatarProps {
  src: string | null
  username: string
  size?: number
  className?: string
}

function getGradientForUsername(username: string): string {
  // Create a simple hash of the username
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use the hash to pick a gradient from our palette
  const index = Math.abs(hash) % CLOUDY_GRADIENTS.length;
  return CLOUDY_GRADIENTS[index];
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

  const gradientClasses = getGradientForUsername(username);

  return (
    <div 
      className={`rounded-full flex items-center justify-center backdrop-blur-sm bg-opacity-80 ${gradientClasses} ${className}`}
      style={{ 
        width: size, 
        height: size, 
        fontSize: size * 0.4,
        boxShadow: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.1)'
      }}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
} 