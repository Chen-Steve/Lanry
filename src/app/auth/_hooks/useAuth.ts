import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { generateUsername } from '@/utils/username';

type AuthMode = 'signin' | 'signup';
type Credentials = {
  email: string;
  password: string;
  confirmPassword: string;
};

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
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  // Check and create profile if needed
  useEffect(() => {
    const createProfileAndReadingTime = async (session: { user: { id: string; email?: string; app_metadata: { provider?: string } } }) => {
      console.log('[Profile] Starting profile creation for user:', session.user.id);
      
      // Get user details from Google auth if available
      const username = session.user.app_metadata.provider === 'google'
        ? session.user.email?.split('@')[0] || generateUsername()
        : generateUsername();
      
      console.log('[Profile] Generated username:', username);

      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: session.user.id,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (createError) {
        console.error('[Profile] Error creating profile:', { 
          error: createError, 
          userId: session.user.id,
          username 
        });
        return false;
      }

      console.log('[Profile] Successfully created profile');
      return true;
    };

    // Subscribe to auth changes
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

        // Check if profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileCheckError) {
          if (profileCheckError.code === 'PGRST116') {
            console.log('[Auth] No existing profile found, creating new profile');
            const success = await createProfileAndReadingTime(session);
            if (!success) {
              console.error('[Auth] Failed to create profile and reading time');
              return;
            }
          } else {
            console.error('[Auth] Error checking existing profile:', profileCheckError);
            return;
          }
        } else {
          console.log('[Auth] Existing profile found:', {
            profileId: existingProfile.id,
            username: existingProfile.username
          });
        }

        // Add a small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[Auth] Redirecting to home page');
        router.push('/');
        router.refresh();
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        await handleSignup();
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

  const handleSignup = async () => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (signUpError) throw new Error(signUpError.message);
    
    if (data.user) {
      await createUserProfile(data.user.id);
      await autoSignIn();
    }
  };

  const createUserProfile = async (userId: string) => {
    const generatedUsername = generateUsername();
    
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          username: generatedUsername,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (profileError) throw new Error('Failed to create user profile');
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
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) throw error;
        await checkAndRedirect();
        return;
      } catch (error) {
        console.error(`Sign-in attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        } else {
          throw error;
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
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
      // Profile creation will happen in the callback route
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
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
    googleLoading,
    emailError,
    setCredentials,
    handleSubmit,
    handleGoogleSignIn,
    resetForm,
    validateEmail
  };
} 