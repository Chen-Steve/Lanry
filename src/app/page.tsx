'use client';

import { useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

export default function HomePage() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && session.user.app_metadata?.provider === 'google') {
          // Check if profile exists
          const { error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();
            
          if (error && error.code === 'PGRST116') {
            // No profile exists, redirect to create-profile page
            window.location.href = '/auth/create-profile';
            return;
          }
        }
        
        // Default redirect to novels
        window.location.href = '/novels';
      } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '/novels';
      }
    };
    
    checkAuth();
  }, []);
  
  // Show nothing while checking
  return null;
}
