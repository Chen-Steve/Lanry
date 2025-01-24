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
    let isInitialCheck = true;

    const checkAndCreateProfile = async (isAuthChange = false) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('[Auth] User session found:', {
            id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata.provider,
            isAuthChange
          });
          
          // For Google Sign In, we want to check immediately
          const isGoogleSignIn = session.user.app_metadata.provider === 'google';
          console.log('[Auth] Sign-in type:', { isGoogleSignIn, provider: session.user.app_metadata.provider });
          
          // Skip profile check on initial page load if not from auth change and not Google
          if (isInitialCheck && !isAuthChange && !isGoogleSignIn) {
            console.log('[Auth] Skipping initial check, waiting for auth state change');
            return;
          }

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.log('[Profile] No existing profile found for user:', session.user.id);
            } else {
              console.error('[Profile] Error fetching profile:', { error: profileError, userId: session.user.id });
              return;
            }
          } else {
            console.log('[Profile] Existing profile found:', { 
              profileId: profile.id, 
              username: profile.username 
            });
          }

          if (!profile) {
            console.log('[Profile] Starting profile creation for user:', session.user.id);
            
            // Get user details from Google auth if available
            const username = session.user.app_metadata.provider === 'google'
              ? session.user.email?.split('@')[0] || generateUsername()
              : generateUsername();
            
            console.log('[Profile] Generated username:', username);

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .upsert([{
                id: session.user.id,
                username,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                current_streak: 0,
                last_visit: new Date().toISOString(),
                coins: 0,
                role: 'USER'
              }], { 
                onConflict: 'id'
              });

            if (createError) {
              console.error('[Profile] Error creating profile:', { 
                error: createError, 
                userId: session.user.id,
                username 
              });
              return;
            }

            console.log('[Profile] Successfully created profile:', { 
              userId: session.user.id, 
              username,
              newProfile 
            });

            // Create initial reading_time record
            console.log('[ReadingTime] Creating initial reading time record for user:', session.user.id);
            
            const { error: readingTimeError } = await supabase
              .from('reading_time')
              .insert([{
                profile_id: session.user.id,
                total_minutes: 0
              }]);

            if (readingTimeError) {
              console.error('[ReadingTime] Error creating reading time record:', { 
                error: readingTimeError, 
                userId: session.user.id 
              });
            } else {
              console.log('[ReadingTime] Successfully created reading time record for user:', session.user.id);
            }

            // Redirect for both auth change and Google sign in
            if (isAuthChange || isGoogleSignIn) {
              console.log('[Auth] Redirecting after successful profile creation:', {
                isAuthChange,
                isGoogleSignIn
              });
              router.push('/');
              router.refresh();
            }
          } else {
            // If profile exists and it's a sign in, redirect
            if (isAuthChange || isGoogleSignIn) {
              console.log('[Auth] Redirecting existing user:', {
                isAuthChange,
                isGoogleSignIn,
                userId: session.user.id
              });
              router.push('/');
              router.refresh();
            }
          }
        } else {
          console.log('[Auth] No user session found');
        }
      } catch (error) {
        console.error('[Auth] Profile check error:', error);
      } finally {
        isInitialCheck = false;
      }
    };

    // Initial check
    checkAndCreateProfile(false);

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        // Add a small delay to ensure the session is fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkAndCreateProfile(true);
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
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        username: generatedUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

    if (profileError) throw new Error('Failed to create user profile');
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
      
      // Profile creation will be handled by auth state change
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