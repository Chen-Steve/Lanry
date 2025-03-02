'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

export default function CreatingProfilePage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const createProfile = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setErrorMessage('Authentication session not found. Please try signing in again.');
          return;
        }

        const userId = session.user.id;
        const email = session.user.email;
        
        console.log('Creating profile for user:', userId);
        
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (existingProfile) {
          console.log('Profile already exists, redirecting...');
          setStatus('success');
          setTimeout(() => router.push('/'), 1000);
          return;
        }
        
        // Generate username from email or random string
        const username = email 
          ? email.split('@')[0] 
          : `user_${Math.random().toString(36).slice(2, 7)}`;
        
        // Create profile
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            current_streak: 0,
            role: 'USER',
            coins: 0
          }]);

        if (createError) {
          console.error('Error creating profile:', createError);
          setStatus('error');
          setErrorMessage('Failed to create your profile. Please try again.');
          return;
        }

        // Create reading time record
        const { error: readingTimeError } = await supabase
          .from('reading_time')
          .insert([{
            profile_id: userId,
            total_minutes: 0
          }]);

        if (readingTimeError) {
          console.error('Error creating reading time:', readingTimeError);
          // Continue anyway since the profile was created
        }
        
        console.log('Successfully created profile');
        setStatus('success');
        
        // Redirect to home page after a short delay
        setTimeout(() => router.push('/'), 1000);
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    createProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 relative">
                <Icon 
                  icon="svg-spinners:180-ring" 
                  className="w-16 h-16 text-primary" 
                />
              </div>
              <h2 className="text-xl font-semibold text-center">Creating Your Profile</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Please wait while we set up your account...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full">
                <Icon icon="mdi:check" className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-center">Profile Created!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Redirecting you to the home page...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full">
                <Icon icon="mdi:alert" className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-center">Error</h2>
              <p className="text-red-500 dark:text-red-400 text-center">
                {errorMessage}
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 