import { Icon } from '@iconify/react';
import { useState } from 'react';

interface GoogleSignInButtonProps {
  loading?: boolean;
}

export function GoogleSignInButton({ loading }: GoogleSignInButtonProps) {
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
      className="w-full p-4 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 
        disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium flex items-center 
        justify-center gap-3 active:transform active:scale-[0.98] transition-transform"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
      ) : showComingSoon ? (
        <span>Coming soon!</span>
      ) : (
        <>
          <Icon icon="flat-color-icons:google" className="text-xl" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
} 