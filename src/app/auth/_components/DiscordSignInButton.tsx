import { Icon } from '@iconify/react';

interface DiscordSignInButtonProps {
  onClick: () => void;
  loading: boolean;
}

export function DiscordSignInButton({ onClick, loading }: DiscordSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#4752C4]/70 text-white py-2 px-4 rounded-md transition-colors"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <Icon icon="mdi:discord" className="w-5 h-5" />
          <span className="font-medium">Continue with Discord</span>
        </>
      )}
    </button>
  );
} 