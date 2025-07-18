'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useTheme, Theme } from '@/lib/ThemeContext';
import { ChangePasswordModal } from './_components/ChangePasswordModal';
import { UpdateProfileModal } from './_components/UpdateProfileModal';
import { TranslatorNovels } from './_components/TranslatorNovels';
import { WiseTagModal } from './_components/WiseTagModal';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
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

const themeIcons: Record<Theme, string> = {
  'light': 'ph:sun-bold',
  'dark': 'ph:moon-bold',
  'blue': 'ph:drop-bold',
  'green': 'ph:leaf-bold',
  'gray': 'ph:circle-half-bold',
  'orange': 'ph:sun-bold'
};

const themeNames: Record<Theme, string> = {
  'light': 'Light',
  'dark': 'Dark',
  'blue': 'Blue',
  'green': 'Green',
  'gray': 'Gray',
  'orange': 'Orange'
};

export default function UserDashboard() {
  const { theme, setTheme } = useTheme();
  const { handleSignOut, userId: authUserId } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDailyRewardsClicked, setIsDailyRewardsClicked] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUpgradeClicked, setIsUpgradeClicked] = useState(false);
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
          {/* Plan Card - Left Column */}
          <div className="md:col-span-2">
            <div className="bg-container border-0 rounded-lg p-4 h-full">
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Your plan</h2>
              {isSubLoading ? (
                <div className="flex items-center">
                  <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-muted-foreground">Checking subscription...</span>
                </div>
              ) : subscriptionStatus?.hasSubscription ? (
                <>
                  <h1 className="text-2xl font-bold text-primary mb-1">
                    {subscriptionStatus.status === 'ACTIVE' ? (
                      ({
                        1: 'Supporter Membership',
                        2: 'Patron Membership',
                        3: 'Super Patron Membership'
                      } as Record<number, string>)[
                        subscriptionStatus.membershipTierId ?? (
                          subscriptionStatus.latestBillingAmount === 5 ? 1 :
                          subscriptionStatus.latestBillingAmount === 9 ? 2 :
                          subscriptionStatus.latestBillingAmount === 20 ? 3 :
                          0
                        )
                      ] || 'Membership'
                    ) : 'Cancelled Membership'}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-3">
                    {subscriptionStatus.status === 'CANCELLED' ? (
                      `Your membership will continue `
                    ) : (
                      `Your next bill is ${subscriptionStatus.membershipTierId ? 
                        `for $${({ 1: 5, 2: 9, 3: 20 } as Record<number, number>)[subscriptionStatus.membershipTierId]}` : 
                        subscriptionStatus.latestBillingAmount ? `for $${subscriptionStatus.latestBillingAmount}` : ''} ${subscriptionStatus.endDate ? `on ${new Date(subscriptionStatus.endDate).toLocaleDateString()}` : 'on your next billing date'}.`
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
                          className="inline-block px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-center font-medium hover:bg-primary/90 transition-colors"
                        >
                          Reactivate
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Free Plan</h1>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to Supporter to unlock all features.
                  </p>
                  <button 
                    onClick={() => setIsUpgradeClicked(true)}
                    disabled={isUpgradeClicked}
                    className={`inline-block px-4 py-1.5 text-center font-medium rounded-full transition-colors ${
                      isUpgradeClicked 
                        ? 'bg-primary/20 text-primary cursor-not-allowed' 
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isUpgradeClicked ? 'Coming Soon' : 'Upgrade'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Daily Rewards Card - Right Column */}
          <div>
            <div className="bg-container border-0 rounded-lg p-4 h-full">
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Rewards</h2>
              <button 
                className="w-full flex items-center justify-between p-3 bg-[#faf7f2] dark:bg-zinc-800 hover:bg-[#faf7f2] dark:hover:bg-zinc-700 transition-colors rounded-lg"
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
        <div>
          <div className="bg-container border-0 rounded-lg">
            <div className="px-4 pt-4">
              <h2 className="text-2xl font-bold">Account</h2>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
            >
              <div className="flex items-center">
                <Icon icon="ph:pencil-simple-line" className="text-xl mr-4" />
                <span>Edit profile</span>
              </div>
              <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
            </button>
            
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
            >
              <div className="flex items-center">
                <Icon icon="ph:lock-key" className="text-xl mr-4" />
                <span>Change Password</span>
              </div>
              <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
            </button>

            <button 
              onClick={() => setIsWiseTagModalOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
            >
              <div className="flex items-center">
                <Icon icon="simple-icons:wise" className="text-xl mr-4 text-green-600" />
                <div className="flex flex-col items-start">
                  <span>Wise Tag</span>
                  <span className="text-xs text-muted-foreground">
                    {profile?.wise_tag ? `@${profile.wise_tag}` : 'Not connected'}
                  </span>
                </div>
              </div>
              <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
            </button>

            <div className="p-4 bg-container rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Theme</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(themeNames).map(([key, name]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key as Theme)}
                      className={`flex items-center p-2.5 rounded-lg transition-colors ${
                        theme === key 
                          ? 'bg-card ring-2 ring-primary/20' 
                          : 'hover:bg-card'
                      }`}
                    >
                      <Icon icon={themeIcons[key as Theme]} className={`text-lg mr-2 ${theme === key ? 'text-primary' : ''}`} />
                      <span className="text-sm">{name}</span>
                      {theme === key && (
                        <Icon icon="ph:check-bold" className="ml-auto text-primary text-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        

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