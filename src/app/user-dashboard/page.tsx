'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme } from '@/lib/ThemeContext';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { UpdateProfileModal } from './_components/UpdateProfileModal';
import { TranslatorNovels } from './_components/TranslatorNovels';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CancelMembershipModal } from './_components/CancelMembershipModal';
import { useAdFreeStatus } from '@/hooks/useAdFreeStatus';

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
  const { handleSignOut, userId: authUserId } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDailyRewardsClicked, setIsDailyRewardsClicked] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const { isAdFree } = useAdFreeStatus();
  const [subscriptionStatus, setSubscriptionStatus] = useState<null | {
    hasSubscription: boolean;
    status?: string;
    plan?: string;
    amount?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    latestBillingDate?: string;
    cancelledAt?: string;
  }>(null);
  const [isSubLoading, setIsSubLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId || undefined),
  });

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!authUserId) return;
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
  }, [authUserId]);

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
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Card - Left Column */}
          <div className="md:col-span-2">
            <div className="bg-card dark:bg-zinc-900 border border-border rounded-lg p-4 h-full">
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Your plan</h2>
              {isSubLoading ? (
                <div className="flex items-center">
                  <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-muted-foreground">Checking subscription...</span>
                </div>
              ) : subscriptionStatus?.hasSubscription ? (
                <>
                  <h1 className="text-2xl font-bold text-primary mb-1">
                    {subscriptionStatus.status === 'ACTIVE' ? 'Premium Membership' : 'Cancelled Membership'}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-3">
                    {subscriptionStatus.status === 'CANCELLED' ? (
                      `Your membership will continue `
                    ) : (
                      `Your next bill is ${subscriptionStatus.amount && subscriptionStatus.currency ? 
                        `for ${subscriptionStatus.currency}${subscriptionStatus.amount.toFixed(2)}` : 
                        ''} ${subscriptionStatus.endDate ? `on ${new Date(subscriptionStatus.endDate).toLocaleDateString()}` : 'on your next billing date'}.`
                    )}
                    {subscriptionStatus.status === 'CANCELLED' && (
                      <>
                        <span className="underline">until</span>
                        {` ${subscriptionStatus.endDate ? new Date(subscriptionStatus.endDate).toLocaleDateString() : 'your current billing period end'}.`}
                      </>
                    )}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">PayPal</div>
                    <div className="flex gap-2">
                      {subscriptionStatus.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => setIsCancelModalOpen(true)}
                            className="px-4 py-1.5 bg-destructive/10 text-destructive rounded-full text-center font-medium hover:bg-destructive/20 transition-colors"
                          >
                            Cancel
                          </button>
                          <Link 
                            href="/shop?tab=membership"
                            className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-center font-medium hover:bg-primary/20 transition-colors"
                          >
                            Change Plan
                          </Link>
                        </>
                      )}
                      {subscriptionStatus.status === 'CANCELLED' && (
                        <Link 
                          href="/shop?tab=membership"
                          className="inline-block px-4 py-1.5 bg-primary rounded-full text-primary-foreground text-center font-medium hover:bg-primary/90 transition-colors"
                        >
                          Renew Membership
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Free Plan</h1>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to Premium to unlock all features.
                  </p>
                  <Link 
                    href="/shop?tab=membership"
                    className="inline-block px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-center font-medium hover:bg-primary/90 transition-colors"
                  >
                    Get Premium
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Daily Rewards Card - Right Column */}
          <div>
            <div className="bg-card dark:bg-zinc-900 border border-border rounded-lg p-4 h-full">
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Rewards</h2>
              <button 
                className="w-full flex items-center justify-between p-3 bg-card/50 hover:bg-card/80 transition-colors rounded-lg"
                onClick={() => {
                  setIsDailyRewardsClicked(true);
                  setTimeout(() => setIsDailyRewardsClicked(false), 2000);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500/10 rounded-lg">
                    <Icon icon="ph:gift-fill" className="text-amber-500 text-2xl" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-foreground text-sm">{isDailyRewardsClicked ? 'Coming Soon' : 'Daily Rewards'}</p>
                  </div>
                </div>
                <Icon icon="ph:caret-right" className="text-lg text-muted-foreground" />
              </button>
            </div>
          </div>

        </div>

        {/* Account Section */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">Account</h2>
          <div className="bg-card dark:bg-zinc-900 border border-border rounded-lg p-6 mb-6">
            {/* Ad-Free Status */}
            <div className="border-b border-border pb-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Ad-Free Experience</h3>
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    {isAdFree ? (
                      <>
                        <span className="text-emerald-500">Active</span>
                        <Icon icon="mdi:check-circle" className="text-emerald-500" />
                      </>
                    ) : (
                      <>
                        <span>Not Active</span>
                        <Icon icon="mdi:information-outline" className="text-amber-500" />
                      </>
                    )}
                  </p>
                </div>
                {!isAdFree && (
                  <Link 
                    href="/shop" 
                    className="text-sm text-primary hover:text-primary/90 transition-colors"
                  >
                    Get Ad-Free
                  </Link>
                )}
              </div>
              {!isAdFree && (
                <p className="text-xs text-muted-foreground mt-2">
                  Purchase at least 50 coins to get ad-free experience
                </p>
              )}
            </div>
            
            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="w-full flex items-center justify-between p-4 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center">
                <Icon icon="ph:pencil-simple-line" className="text-xl mr-4" />
                <span>Edit profile</span>
              </div>
              <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
            </button>
            
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center">
                <Icon icon="ph:lock-key" className="text-xl mr-4" />
                <span>Change Password</span>
              </div>
              <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
            </button>

            <button 
              className="w-full flex items-center justify-between p-4 hover:bg-card/80 transition-colors"
              onClick={toggleTheme}
            >
              <div className="flex items-center">
                <Icon icon={theme === 'dark' ? "ph:sun-bold" : "ph:moon-bold"} className="text-xl mr-4" />
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
          </div>
        </div>
        

        {/* Log out button at the bottom */}
        <div className="mt-6">
          <button 
            onClick={handleSignOut}
            className="w-full bg-card dark:bg-zinc-900 border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-card/80 transition-colors"
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

      <CancelMembershipModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
} 