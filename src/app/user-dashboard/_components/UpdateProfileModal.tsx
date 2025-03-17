'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { uploadImage } from '@/services/uploadService';
import type { UserProfile } from '@/types/database';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: UserProfile;
}

export function UpdateProfileModal({ isOpen, onClose, onSuccess, profile }: UpdateProfileModalProps) {
  const [name, setName] = useState(profile.username || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url || null);
  const queryClient = useQueryClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        let avatarUrl = profile.avatar_url;

        if (imageFile) {
          avatarUrl = await uploadImage(imageFile, profile.id);
        }

        // Get current profile data first
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (fetchError) throw fetchError;

        // Merge current profile with updates
        const mergedProfile = {
          ...currentProfile,
          username: name,
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
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    onSuccess: () => {
      if (previewUrl && (previewUrl.startsWith('blob:') || previewUrl.startsWith('data:'))) {
        URL.revokeObjectURL(previewUrl);
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !imageFile) {
      throw new Error('Please provide a name or image to update');
    }
    mutation.mutate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-background dark:bg-background rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Update Profile</h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close modal"
                >
                  <Icon icon="ph:x" className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-accent">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                        onError={() => setPreviewUrl(null)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon icon="ph:user" className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                    <Icon icon="ph:camera" className="w-5 h-5" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="name" className="text-sm font-medium">
                      Display Name
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {name.length}/50
                    </span>
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      if (e.target.value.length <= 50) {
                        setName(e.target.value);
                      }
                    }}
                    maxLength={50}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {mutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <Icon icon="ph:spinner" className="w-5 h-5 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 