import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { generateUsername } from '@/utils/username';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type AuthMode = 'signin' | 'signup';

interface Credentials {
  email: string;
  password: string;
  confirmPassword?: string;
}

export function useAuth() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [credentials, setCredentials] = useState<Credentials>({ 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const createUserProfile = async (userId: string, email?: string) => {
    console.log('[Profile] Starting profile creation for user:', userId);
    
    // Generate username from email or random
    const username = email ? email.split('@')[0] : generateUsername();
    console.log('[Profile] Generated username:', username);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'USER',
        coins: 0
      }]);

    if (profileError) {
      console.error('[Profile] Error creating profile:', profileError);
      throw new Error('Failed to create user profile');
    }

    console.log('[Profile] Successfully created profile for:', userId);

    // Invalidate cached user profile so components refetch with fresh data
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
  };

  const handleSignup = async (captchaToken?: string) => {
    if (!captchaToken) {
      throw new Error('Please complete the captcha verification');
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        captchaToken
      }
    });

    if (signUpError) throw new Error(signUpError.message);
    
    if (data.user) {
      // Profile creation will occur after automatic sign-in via the
      // onAuthStateChange listener, so we only need to trigger sign-in here.
      await autoSignIn();
    }
  };

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', { 
        event, 
        userId: session?.user?.id,
        provider: session?.user?.app_metadata?.provider 
      });

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] Processing sign in for user:', {
          id: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata.provider
        });

        // For email sign-in, we need to handle profile creation here
        // Google sign-in profile creation is handled in the callback route
        if (session.user.app_metadata.provider !== 'google') {
          // Check if profile exists
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileCheckError) {
            console.error('[Auth] Profile check error:', profileCheckError);
          }

          if (!existingProfile) {
            console.log('[Auth] Creating profile for email user');
            await createUserProfile(session.user.id, session.user.email);
          }
          
          // Only redirect for non-Google sign-ins
          // Add a small delay before redirect
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('[Auth] Redirecting to home page');
          router.push('/');
          router.refresh();
        } else {
          console.log('[Auth] Google sign-in detected, not redirecting (handled by callback route)');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, captchaToken?: string) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(credentials.email)) return;
    
    if (mode === 'signup' && credentials.password !== credentials.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await handleSignup(captchaToken);
      } else {
        await handleSignin();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const autoSignIn = async () => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (signInError) throw new Error('Account created but failed to sign in automatically');
    await checkAndRedirect();
  };

  const handleSignin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      await checkAndRedirect();
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      toast.loading('Signing in with Google...');
      
      // Get the current URL from window location
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : process.env.NEXT_PUBLIC_BASE_URL 
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
          : null;

      if (!redirectUrl) {
        throw new Error('No redirect URL available');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      // Profile creation will happen in the auth state change handler
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Google sign-in failed');
      toast.error('Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    try {
      setDiscordLoading(true);
      
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : process.env.NEXT_PUBLIC_BASE_URL 
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
          : null;

      if (!redirectUrl) {
        throw new Error('No redirect URL available');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify email',
        }
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('Discord sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Discord sign-in failed');
    } finally {
      setDiscordLoading(false);
    }
  };

  const checkAndRedirect = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session) {
      throw new Error('Failed to establish session');
    }
    router.push('/');
    router.refresh();
  };

  const resetForm = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setEmailError('');
    setCredentials({ email: '', password: '', confirmPassword: '' });
  };

  return {
    mode,
    credentials,
    error,
    loading,
    emailError,
    googleLoading,
    discordLoading,
    setCredentials,
    handleSubmit,
    resetForm,
    validateEmail,
    handleGoogleSignIn,
    handleDiscordSignIn
  };
} 