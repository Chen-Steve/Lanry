'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/lib/ThemeContext';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { UpdateProfileModal } from './_components/UpdateProfileModal';
import { TranslatorNovels } from './_components/TranslatorNovels';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';
import { useSearchParams } from 'next/navigation';

const fetchProfile = async (userId?: string): Promise<UserProfile> => {
  if (userId) {
    // Fetch other user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Fetch current user's profile
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

export default function UserDashboard() {
  const { theme, toggleTheme } = useTheme();
  const { handleSignOut } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDailyRewardsClicked, setIsDailyRewardsClicked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId || undefined),
  });

  if (isLoading || !profile) {
    return <div className="container mx-auto px-4 py-6 max-w-5xl">Loading...</div>;
  }

  // If viewing another user's profile
  if (userId) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col items-center">
          {profile.avatar_url ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
              <img
                src={profile.avatar_url}
                alt={profile.username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement?.parentElement;
                  if (parent && profile.username) {
                    parent.innerHTML = profile.username[0].toUpperCase();
                    parent.className = "w-32 h-32 rounded-full bg-primary flex items-center justify-center text-4xl font-semibold text-primary-foreground border-4 border-primary/20";
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-4xl font-semibold text-primary-foreground border-4 border-primary/20 mb-4">
              {profile.username ? profile.username[0].toUpperCase() : '?'}
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">{profile.username || 'Anonymous User'}</h1>
          
          {profile.role === 'TRANSLATOR' && (
            <div className="mt-8 w-full">
              <h2 className="text-xl font-semibold mb-4">Translated Novels</h2>
              <TranslatorNovels translatorId={profile.id} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Current user's dashboard
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex flex-col gap-6">
        <button 
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg w-fit"
          onClick={() => {
            setIsDailyRewardsClicked(true);
            setTimeout(() => setIsDailyRewardsClicked(false), 2000);
          }}
        >
          <Icon icon="ph:gift-fill" className="w-5 h-5" />
          <span className="font-medium">{isDailyRewardsClicked ? 'Coming Soon' : 'Daily Rewards'}</span>
        </button>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          
          <div className="flex flex-col rounded-lg border border-border overflow-hidden">
            <button 
              className="flex items-center justify-between px-4 py-2.5 bg-card hover:bg-accent transition-colors w-full"
              onClick={toggleTheme}
            >
              <div className="flex items-center gap-3">
                <Icon icon={theme === 'dark' ? "ph:sun-bold" : "ph:moon-bold"} className="w-5 h-5" />
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={`
                w-9 h-5 rounded-full p-0.5 transition-colors duration-200
                ${theme === 'dark' ? 'bg-primary' : 'bg-gray-200'}
              `}>
                <div className={`
                  w-4 h-4 rounded-full bg-white transition-transform duration-200
                  ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}
                `} />
              </div>
            </button>

            <button 
              className="flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-accent transition-colors w-full"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <Icon icon="mdi:key" className="w-5 h-5" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          
          <div className="flex flex-col rounded-lg border border-border overflow-hidden">
            <Link
              href="/user-dashboard/inventory"
              className="flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-accent transition-colors w-full"
            >
              <Icon icon="ph:stack-fill" className="w-5 h-5" />
              <span>Inventory</span>
            </Link>

            <button 
              className="flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-accent transition-colors w-full"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <Icon icon="ph:user-circle-fill" className="w-5 h-5" />
              <span>Update Profile</span>
            </button>

            <button 
              className="flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-accent transition-colors w-full"
              onClick={handleSignOut}
            >
              <Icon icon="ix:log-out" className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Password changed successfully!', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
      />

      <UpdateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Profile updated successfully!', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
        profile={profile}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white z-50`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={toast.type === 'success' ? 'ph:check-circle' : 'ph:x-circle'}
                className="w-5 h-5"
              />
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 hover:opacity-80"
                aria-label="Close notification"
              >
                <Icon icon="ph:x" className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 