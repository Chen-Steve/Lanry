import { Icon } from '@iconify/react';

interface GoogleSignInButtonProps {
  loading?: boolean;
  onClick: () => Promise<void>;
}

export function GoogleSignInButton({ loading, onClick }: GoogleSignInButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full p-4 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 
        ${loading ? 'opacity-50 cursor-not-allowed' : 'active:transform active:scale-[0.98]'} 
        transition-transform flex items-center justify-center gap-3 no-underline text-base font-medium`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
      ) : (
        <>
          <Icon icon="flat-color-icons:google" className="text-xl" />
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
} 