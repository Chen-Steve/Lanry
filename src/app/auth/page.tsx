'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { generateUsername } from '@/utils/username';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';
import { PasswordInput } from '@/components/auth/PasswordInput';
import toast from 'react-hot-toast';

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

          router.push('/');
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`, {
      icon: <Icon icon="material-symbols:sentiment-very-satisfied" className="text-xl" />,
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            className="text-black w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Icon icon="logos:google-icon" className="text-xl" />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('discord')}
            className="text-black w-full p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Icon icon="logos:discord-icon" className="text-xl" />
            Continue with Discord
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              title="Email"
              type="email"
              value={credentials.email}
              onChange={(e) => {
                setCredentials({ ...credentials, email: e.target.value });
                validateEmail(e.target.value);
              }}
              className={`text-black w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black
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
            className="text-black w-full p-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium flex items-center justify-center gap-2"
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

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setEmailError('');
              setCredentials({ email: '', password: '', confirmPassword: '' });
            }}
            className="text-black hover:text-gray-600 text-base py-2 font-medium"
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}