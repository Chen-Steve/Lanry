import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';

// Separate data fetching function
const fetchProfile = async (): Promise<UserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    username: '',
    current_streak: 0,
    last_visit: null,
    created_at: '',
    updated_at: '',
    coins: 0,
    role: 'USER'
  });

  const queryClient = useQueryClient();

  // Use React Query for fetching profile
  const { isLoading, data } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  // Update profile when data changes
  useEffect(() => {
    if (data) {
      setProfile(data);
    }
  }, [data]);

  // Use mutation for saving settings
  const mutation = useMutation({
    mutationFn: async (updatedProfile: UserProfile) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...updatedProfile,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Settings saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(profile);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
} 