import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export function useGoogleDrive() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsConnected(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('drive_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      }

      setIsConnected(!!data);
      setLoading(false);
    };

    checkConnection();
  }, []);

  const connect = () => {
    window.location.href = '/api/google/auth';
  };

  return { isConnected, loading, error, connect };
} 