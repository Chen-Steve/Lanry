'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { generateUsername } from '@/utils/username';
import { LoadingSpinner } from '@/app/auth/_components/LoadingSpinner';
import { PasswordInput } from '@/app/auth/_components/PasswordInput';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [credentials, setCredentials] = useState({ 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

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
        // First attempt signup
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw new Error(signUpError.message);
        }
        
        // If signup successful and we have a user
        if (data.user) {
          const generatedUsername = generateUsername();
          
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username: generatedUsername,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error('Failed to create user profile');
          }

          // Auto sign-in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (signInError) {
            console.error('Auto sign-in error:', signInError);
            throw new Error('Account created but failed to sign in automatically');
          }

          // Wait for session to be established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: sessionCheck } = await supabase.auth.getSession();
          if (!sessionCheck.session) {
            throw new Error('Failed to establish session');
          }

          router.push('/');
          router.refresh();
        }
      } else {
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            const { error } = await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            });

            if (error) throw error;

            // Wait for session to be established
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: sessionCheck } = await supabase.auth.getSession();
            if (!sessionCheck.session) {
              throw new Error('Failed to establish session');
            }

            router.push('/');
            router.refresh();
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
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[min(100%,24rem)] space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-black">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              title="Email"
              type="email"
              value={credentials.email}
              onChange={(e) => {
                setCredentials({ ...credentials, email: e.target.value });
                validateEmail(e.target.value);
              }}
              className={`text-black w-full p-4 border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-base
                ${emailError ? 'border-red-500' : ''}`}
              placeholder="Email"
              required
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          <PasswordInput
            value={credentials.password}
            onChange={(value) => setCredentials({ ...credentials, password: value })}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            showStrength={mode === 'signup'}
          />

          {mode === 'signup' && (
            <PasswordInput
              value={credentials.confirmPassword}
              onChange={(value) => setCredentials({ ...credentials, confirmPassword: value })}
              placeholder="Confirm Password"
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 
              disabled:cursor-not-allowed text-base font-medium flex items-center justify-center gap-2 
              active:transform active:scale-[0.98] transition-transform"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Loading...</span>
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
            setEmailError('');
            setCredentials({ email: '', password: '', confirmPassword: '' });
          }}
          className="w-full text-center text-black hover:text-gray-600 text-sm sm:text-base py-2 font-medium"
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}