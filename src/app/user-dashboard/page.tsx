'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/lib/ThemeContext';
import { PlanCard } from './_components/PlanCard';
import { RewardsCard } from './_components/RewardsCard';
import { AccountSection } from './_components/AccountSection';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { UpdateProfileModal } from './_components/UpdateProfileModal';
import { TranslatorNovels } from './_components/TranslatorNovels';
import { WiseTagModal } from './_components/WiseTagModal';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CancelMembershipModal } from './_components/CancelMembershipModal';

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

// Theme icon/name definitions moved into AccountSection component

export default function UserDashboard() {
  const { theme, setTheme } = useTheme();
  const { handleSignOut, userId: authUserId } = useAuth();
  const SUBSCRIPTIONS_ENABLED = false;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isWiseTagModalOpen, setIsWiseTagModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || searchParams.get('id');
  const [subscriptionStatus, setSubscriptionStatus] = useState<null | {
    hasSubscription: boolean;
    status?: string;
    plan?: string;
    membershipTierId?: number;
    latestBillingAmount?: number;
    startDate?: string;
    endDate?: string;
    latestBillingDate?: string;
    cancelledAt?: string;
  }>(null);
  const [isSubLoading, setIsSubLoading] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId || undefined),
  });

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!SUBSCRIPTIONS_ENABLED || !authUserId) return;
      setIsSubLoading(true);
      try {
        const res = await fetch(`/api/subscriptions/status?userId=${authUserId}`);
        const data = await res.json();
        setSubscriptionStatus(data);
      } catch {
        setSubscriptionStatus(null);
      } finally {
        setIsSubLoading(false);
      }
    };
    fetchSubscriptionStatus();
  }, [authUserId, SUBSCRIPTIONS_ENABLED]);

  // Analytics consent handling moved into AccountSection

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
          <h1 className="text-2xl font-bold text-foreground mb-4">{profile.username || 'Anonymous User'}</h1>
          
          {profile.role === 'TRANSLATOR' && (
            <div className="mt-4 w-full">
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
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col gap-2">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <PlanCard
              subscriptionStatus={subscriptionStatus}
              isSubLoading={isSubLoading}
              onCancel={() => setIsCancelModalOpen(true)}
              profile={profile}
            />
          </div>
          <div>
            <RewardsCard />
          </div>
        </div>

        {/* Account Section */}
        <AccountSection
          profile={profile}
          theme={theme}
          setTheme={setTheme}
          onEditProfile={() => setIsProfileModalOpen(true)}
          onChangePassword={() => setIsPasswordModalOpen(true)}
          onWiseTag={() => setIsWiseTagModalOpen(true)}
        />
        

        {/* Log out button at the bottom */}
        <div>
          <button 
            onClick={handleSignOut}
            className="w-full bg-container border-0 rounded-lg p-4 flex items-center gap-3 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors"
          >
            <Icon icon="ph:sign-out" className="text-xl" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          toast.success('Password changed successfully!');
        }}
      />

      <UpdateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={() => {
          toast.success('Profile updated successfully!');
        }}
        profile={profile}
      />

      <WiseTagModal
        isOpen={isWiseTagModalOpen}
        onClose={() => setIsWiseTagModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
        currentWiseTag={profile?.wise_tag}
      />

      <CancelMembershipModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
} 