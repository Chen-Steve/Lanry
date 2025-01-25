import { Icon } from '@iconify/react';
import { useState } from 'react';

interface DiscordSignInButtonProps {
  loading?: boolean;
}

export function DiscordSignInButton({ loading }: DiscordSignInButtonProps) {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full p-4 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] 
        disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium flex items-center 
        justify-center gap-3 active:transform active:scale-[0.98] transition-transform"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      ) : showComingSoon ? (
        <span>Coming soon!</span>
      ) : (
        <>
          <Icon icon="ic:baseline-discord" className="text-xl" />
          <span>Continue with Discord</span>
        </>
      )}
    </button>
  );
} 