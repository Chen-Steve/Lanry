import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { uploadImage } from '@/services/uploadService';

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isLoading, data } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (data) {
      setProfileState(data);
      // Only update avatar preview if we're not in the middle of an upload
      if (!isUploading && !avatarFile) {
        setAvatarPreview(data.avatar_url || null);
      }
    }
  }, [data, isUploading, avatarFile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const mutation = useMutation({
    mutationFn: async (updatedProfile: UserProfile) => {
      setIsUploading(true);
      try {
        let avatarUrl = updatedProfile.avatar_url;

        if (avatarFile) {
          // console.log('Uploading new avatar file:', avatarFile.name);
          avatarUrl = await uploadImage(avatarFile, profileState.id);
          // console.log('Got new avatar URL:', avatarUrl);
          // Update preview with the new URL immediately
          setAvatarPreview(avatarUrl);
        }

        // console.log('Updating profile with avatar URL:', avatarUrl);
        const { error } = await supabase
          .from('profiles')
          .upsert({
            ...updatedProfile,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        return avatarUrl; // Return the URL for onSuccess handler
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (newAvatarUrl) => {
      // Clean up any object URLs
      if (avatarPreview && (avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:'))) {
        URL.revokeObjectURL(avatarPreview);
      }
      
      // Update the preview with the final URL
      if (newAvatarUrl) {
        setAvatarPreview(newAvatarUrl);
      }
      
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Settings saved successfully!');
      setAvatarFile(null);
    },
    onError: () => {
      // console.error('Error saving settings:', error);
      alert('Failed to save settings');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(profileState);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // console.error('Error logging out:', error);
      alert('Failed to log out');
      return;
    }
    
    // Clear any cached data
    queryClient.clear();
    router.push('/auth');
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile avatar"
                  width={96}
                  height={96}
                  unoptimized
                  className="w-full h-full object-cover"
                  onError={() => {
                    // console.log('Image failed to load:', avatarPreview);
                    setAvatarPreview(null);
                  }}
                  onLoad={() => {
                    // console.log('Image loaded successfully:', avatarPreview);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-2xl">
                  {profileState.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors"
            >
              <Icon icon="mdi:camera" className="w-4 h-4 text-white" />
              <input
                aria-label="Upload avatar"
                type="file"
                id="avatar-upload"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          {avatarFile && (
            <p className="text-sm text-gray-500">
              New image selected: {avatarFile.name}
            </p>
          )}
          {avatarPreview && (
            <a href={avatarPreview} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">
              View direct image
            </a>
          )}
        </div>

        <div>
          <label htmlFor="username" className="text-black block mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={profileState.username || ''}
            onChange={(e) => setProfileState({ ...profileState, username: e.target.value })}
            className="w-full p-2 text-black border rounded"
            placeholder="Enter username"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {mutation.isPending || isUploading ? 'Saving...' : 'Save'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings; 