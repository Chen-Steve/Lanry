import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { uploadImage } from '@/services/uploadService';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
        type === 'success' 
          ? 'bg-emerald-500 text-white' 
          : 'bg-red-500 text-white'
      }`}
    >
      <Icon 
        icon={type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'} 
        className="w-5 h-5"
      />
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        <Icon icon="mdi:close" className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

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
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username || '');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const queryClient = useQueryClient();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      ...profileState,
      username: isEditingUsername ? tempUsername : profileState.username
    };
    mutation.mutate(updatedProfile);
  };

  const mutation = useMutation({
    mutationFn: async (updatedProfile: UserProfile) => {
      setIsUploading(true);
      try {
        let avatarUrl = updatedProfile.avatar_url;

        if (avatarFile) {
          avatarUrl = await uploadImage(avatarFile, profileState.id);
          setAvatarPreview(avatarUrl);
        }

        // Get current profile data first
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileState.id)
          .single();

        if (fetchError) throw fetchError;

        // Merge current profile with updates
        const mergedProfile = {
          ...currentProfile,
          username: updatedProfile.username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('profiles')
          .upsert(mergedProfile)
          .select()
          .single();

        if (error) throw error;
        return { avatarUrl, updatedProfile: data };
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (result) => {
      if (avatarPreview && (avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:'))) {
        URL.revokeObjectURL(avatarPreview);
      }
      
      setProfileState(result.updatedProfile);
      setAvatarPreview(result.avatarUrl || null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setToast({ message: 'Settings saved successfully!', type: 'success' });
      setAvatarFile(null);
      setIsEditingUsername(false);
    },
    onError: () => {
      setToast({ message: 'Failed to save settings', type: 'error' });
    },
  });

  const handleUsernameEdit = () => {
    if (isEditingUsername) {
      // Cancel edit
      setTempUsername(profileState.username || '');
      setIsEditingUsername(false);
    } else {
      setIsEditingUsername(true);
    }
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
            <div className="max-w-xs">
              <div className="flex justify-between items-center">
                <label htmlFor="username" className="text-sm text-foreground">
                  Username
                </label>
                <span className="text-xs text-muted-foreground">
                  {(tempUsername.length || 0)}/50
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="username"
                  value={tempUsername}
                  onChange={(e) => {
                    if (e.target.value.length <= 50) {
                      setTempUsername(e.target.value);
                    }
                  }}
                  disabled={!isEditingUsername}
                  maxLength={50}
                  className="flex-1 p-1.5 text-sm text-foreground bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter username"
                />
                <button
                  type="button"
                  onClick={handleUsernameEdit}
                  className="px-2.5 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
                >
                  {isEditingUsername ? (
                    <Icon icon="heroicons:x-mark" className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Icon icon="heroicons:pencil-square" className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            {avatarFile && (
              <p className="text-xs text-muted-foreground">
                New image: {avatarFile.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {(isEditingUsername || avatarFile) && (
            <button
              type="submit"
              disabled={mutation.isPending || isUploading}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {mutation.isPending || isUploading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </form>
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Settings; 