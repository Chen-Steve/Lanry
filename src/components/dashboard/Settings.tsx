import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';

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

interface SettingsProps {
  profile: UserProfile;
}

const Settings = ({ profile }: SettingsProps) => {
  const [profileState, setProfileState] = useState<UserProfile>(profile);
  const queryClient = useQueryClient();

  const { isLoading, data } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (data) {
      setProfileState(data);
    }
  }, [data]);

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
    mutation.mutate(profileState);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="text-black block mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={profileState.username}
            onChange={(e) => setProfileState({ ...profileState, username: e.target.value })}
            className="w-full p-2 text-black border rounded"
            placeholder="Enter username"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default Settings; 