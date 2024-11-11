'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Icon } from '@iconify/react';
import { generateUsername } from '@/utils/username';

type AuthMode = 'signin' | 'signup';
type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  // Number check
  if (/\d/.test(password)) score++;
  
  // Uppercase and lowercase check
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  
  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  };

  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full'
  };

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strengthColors[strength]} ${strengthWidth[strength]} transition-all duration-300`}
        />
      </div>
      <p className={`text-xs mt-1 ${
        strength === 'weak' ? 'text-red-500' : 
        strength === 'medium' ? 'text-yellow-600' : 
        'text-green-600'
      }`}>
        {strength === 'weak' && 'Weak - Add numbers, special characters, and mix cases'}
        {strength === 'medium' && 'Medium - Add more complexity for a stronger password'}
        {strength === 'strong' && 'Strong password!'}
      </p>
    </div>
  );
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && credentials.password !== credentials.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) throw error;
        
        // If signup successful, create profile and sign them in
        if (data.user) {
          const generatedUsername = generateUsername();
          
          // Create profile with generated username
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

          if (profileError) throw profileError;

          // Automatically sign them in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (signInError) throw signInError;
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              title="Email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                title="Password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon 
                  icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
                  className="text-xl"
                  aria-hidden="true"
                />
              </button>
            </div>
            {mode === 'signup' && (
              <PasswordStrengthIndicator password={credentials.password} />
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  title="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon 
                    icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
                    className="text-xl"
                    aria-hidden="true"
                  />
                </button>
              </div>
              {credentials.confirmPassword && credentials.password !== credentials.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-black hover:text-gray-600 text-base py-2"
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}