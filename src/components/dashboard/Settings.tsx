import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../Providers';

interface Profile {
  id: string;
  username: string | null;
  current_streak: number;
  last_visit: Date | null;
  role: 'USER' | 'ADMIN';
  coins: number;
  created_at: Date;
  updated_at: Date;
}

interface SettingsProps {
  profile: Profile | null | undefined;
}

export default function Settings({ profile }: SettingsProps) {
  const { supabase } = useSupabase();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', profile?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: ['profile', profile?.id]
      });
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    updateProfileMutation.mutate(username);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
      <div className="max-w-md space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setUsername(profile?.username || '');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-900">{profile?.username}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-600"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 