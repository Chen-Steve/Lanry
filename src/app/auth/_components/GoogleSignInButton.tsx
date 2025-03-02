import { Icon } from '@iconify/react';

interface GoogleSignInButtonProps {
  loading?: boolean;
}

export function GoogleSignInButton({ loading }: GoogleSignInButtonProps) {
  // Construct the redirect URL
  const redirectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : '/auth/callback';
  
  // Get the Supabase URL from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Construct the OAuth URL
  const oauthUrl = supabaseUrl 
    ? `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&prompt=consent&access_type=offline`
    : '#';

  return (
    <a
      href={oauthUrl}
      className={`w-full p-4 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 
        ${loading ? 'opacity-50 cursor-not-allowed' : 'active:transform active:scale-[0.98]'} 
        transition-transform flex items-center justify-center gap-3 no-underline text-base font-medium`}
      onClick={(e) => {
        if (loading || !supabaseUrl) {
          e.preventDefault();
          if (!supabaseUrl) {
            console.error('Supabase URL not configured');
          }
        }
      }}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
      ) : (
        <>
          <Icon icon="flat-color-icons:google" className="text-xl" />
          <span>Sign in with Google</span>
        </>
      )}
    </a>
  );
} 