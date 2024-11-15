import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface Profile {
  id: string;
  username: string | null;
  currentStreak: number;
  lastVisit: Date | null;
  role: 'USER' | 'ADMIN';
  coins: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SettingsProps {
  profile: Profile | null | undefined;
}

export default function Settings({ profile }: SettingsProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      if (session) {
        // NextAuth user
        const response = await fetch(`/api/profile/${profile?.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: newUsername }),
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
      } else {
        // Supabase user
        const { data, error } = await supabase
          .from('profiles')
          .update({ username: newUsername })
          .eq('id', profile?.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
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

        {/* Add other settings sections here */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Info</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Current Streak
              </label>
              <p className="mt-1">{profile?.currentStreak || 0} days</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Coins
              </label>
              <p className="mt-1">{profile?.coins || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 