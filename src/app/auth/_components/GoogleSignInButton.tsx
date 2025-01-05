import { Icon } from '@iconify/react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function GoogleSignInButton({ onClick, loading }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full p-4 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 
        disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium flex items-center 
        justify-center gap-3 active:transform active:scale-[0.98] transition-transform"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
      ) : (
        <>
          <Icon icon="flat-color-icons:google" className="text-xl" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
} 