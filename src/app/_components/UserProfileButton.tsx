'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  username: string;
  current_streak: number;
  last_visit: string | null;
  coins: number;
  avatar_url?: string;
  role?: string;
}

interface UserProfileButtonProps {
  userProfile: UserProfile | null | undefined;
  isProfileDropdownOpen: boolean;
  setIsProfileDropdownOpen: (isOpen: boolean) => void;
  onSignOut: () => void;
  isMobile?: boolean;
  onMenuClose?: () => void;
}

const UserProfileButton = ({
  userProfile,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  onSignOut,
  isMobile = false,
  onMenuClose
}: UserProfileButtonProps) => {
  const router = useRouter();
  const [isRandomizing, setIsRandomizing] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<null | {
    hasSubscription: boolean;
    status?: string;
    plan?: string;
    startDate?: string;
    endDate?: string;
    latestBillingDate?: string;
    cancelledAt?: string;
    latestBillingAmount?: number;
  }>(null);
  const [isSubLoading, setIsSubLoading] = useState(false);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target as Node) &&
        isProfileDropdownOpen
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, setIsProfileDropdownOpen]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!userId) return;
      setIsSubLoading(true);
      try {
        const res = await fetch(`/api/subscriptions/status?userId=${userId}`);
        const data = await res.json();
        setSubscriptionStatus(data);
      } catch {
        setSubscriptionStatus(null);
      } finally {
        setIsSubLoading(false);
      }
    };
    fetchSubscriptionStatus();
  }, [userId]);

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Add helper function to determine membership tier
  const getMembershipTier = (amount?: number) => {
    if (!amount) return null;
    if (amount === 5) return { name: "Supporter", icon: "material-symbols:verified-outline", color: "text-blue-400" };
    if (amount === 9) return { name: "Patron", icon: "material-symbols:diamond", color: "text-purple-500" };
    if (amount === 19) return { name: "VIP", icon: "material-symbols:star-rounded", color: "text-amber-500" };
    return null;
  };

  const renderAvatar = () => {
    if (!userProfile) return null;

    return (
      <div className="flex items-center gap-2">
        {userProfile.avatar_url ? (
          <div className="relative">
            <img
              src={userProfile.avatar_url}
              alt={userProfile.username}
              className="w-8 h-8 rounded-full object-cover"
              onError={() => {
                const target = document.querySelector(`img[alt="${userProfile.username}"]`) as HTMLImageElement;
                if (target) {
                  target.remove();
                }
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              {userProfile?.username ? getInitial(userProfile.username) : '?'}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleRandomNovel = async () => {
    if (isRandomizing) return;
    
    try {
      setIsRandomizing(true);
      const response = await fetch('/api/novels/random');
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching random novel:', data.error);
        return;
      }
      
      setIsProfileDropdownOpen(false);
      router.push(`/novels/${data.slug}`);
    } catch (error) {
      console.error('Error fetching random novel:', error);
    } finally {
      setIsRandomizing(false);
    }
  };

  const dropdownContent = (
    <div className="dropdown-content p-2 space-y-2">
      {/* Profile Header Section */}
      <div className="p-3 bg-accent/50 rounded-lg">
        <div className="flex items-center gap-3">
          {renderAvatar()}
          <div>
            <div className="font-medium">{userProfile?.username || 'Error loading profile'}</div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                {userProfile?.coins || 0} coins
              </div>
              <span className="text-muted-foreground">•</span>
              {isSubLoading ? (
                <span className="text-muted-foreground text-sm">Loading...</span>
              ) : subscriptionStatus?.hasSubscription ? (
                <span className={
                  subscriptionStatus.status === 'ACTIVE'
                    ? getMembershipTier(subscriptionStatus.latestBillingAmount)?.color || 'text-muted-foreground'
                    : 'text-muted-foreground'
                }>
                  {subscriptionStatus.status === 'ACTIVE' 
                    ? getMembershipTier(subscriptionStatus.latestBillingAmount)?.name || 'Member'
                    : `${subscriptionStatus.status}`
                  }
                </span>
              ) : (
                <span className="text-muted-foreground">Free</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="border-t border-border pt-2">
        <Link
          href="/user-dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileDropdownOpen(false);
            onMenuClose?.();
          }}
        >
          <Icon icon="ph:user" className="text-lg" />
          <span>View Profile</span>
        </Link>

        <Link
          href="/forum"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileDropdownOpen(false);
            onMenuClose?.();
          }}
        >
          <Icon icon="ph:chats" className="text-lg" />
          <span>Forum</span>
        </Link>

        {userProfile?.role && (userProfile.role === 'AUTHOR' || userProfile.role === 'TRANSLATOR') && (
          <Link
            href="/author/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileDropdownOpen(false);
              onMenuClose?.();
            }}
          >
            <Icon icon="ph:pencil-line" className="text-lg" />
            <span>Author Dashboard</span>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border pt-2">
        <button
          onClick={handleRandomNovel}
          disabled={isRandomizing}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Icon 
            icon={isRandomizing ? "eos-icons:loading" : "ph:shuffle"} 
            className={`text-lg ${isRandomizing ? 'animate-spin' : ''}`}
          />
          <span>Random Novel</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSignOut();
            onMenuClose?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <Icon icon="ph:sign-out" className="text-lg" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative" ref={profileDropdownRef}>
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
        >
          {renderAvatar()}
        </button>
        <div className={`dropdown absolute right-0 top-full mt-1 w-64 bg-background rounded-lg shadow-lg py-1 z-50 border border-border ${isProfileDropdownOpen ? 'dropdown-open' : ''}`}>
          {isProfileDropdownOpen && dropdownContent}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={profileDropdownRef}>
      <button
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
      >
        {renderAvatar()}
      </button>
      <div className={`dropdown absolute right-0 mt-1 w-72 bg-background rounded-lg shadow-lg border border-border overflow-hidden ${isProfileDropdownOpen ? 'dropdown-open' : ''}`}>
        {isProfileDropdownOpen && dropdownContent}
      </div>
    </div>
  );
};

export default UserProfileButton; 