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
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-3">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile avatar"
                  width={64}
                  height={64}
                  unoptimized
                  className="w-full h-full object-cover"
                  onError={() => {
                    setAvatarPreview(null);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xl">
                  {profileState.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Icon icon="mdi:camera" className="w-3 h-3 text-primary-foreground" />
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
          
          <div className="flex-1 space-y-1">
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="username" className="text-sm text-foreground">
                  Username
                </label>
                <span className="text-xs text-muted-foreground">
                  {(profileState.username?.length || 0)}/50
                </span>
              </div>
              <input
                type="text"
                id="username"
                value={profileState.username || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setProfileState({ ...profileState, username: e.target.value });
                  }
                }}
                maxLength={50}
                className="w-full p-1.5 text-sm text-foreground bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Enter username"
              />
            </div>
            {avatarFile && (
              <p className="text-xs text-muted-foreground">
                New image: {avatarFile.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending || isUploading}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {mutation.isPending || isUploading ? 'Saving...' : 'Save'}
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-red-600 dark:bg-red-900 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings; 