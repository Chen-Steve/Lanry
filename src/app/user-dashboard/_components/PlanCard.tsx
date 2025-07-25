'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import React from 'react';
import type { UserProfile } from '@/types/database';

interface SubscriptionStatus {
  hasSubscription: boolean;
  status?: string;
  plan?: string;
  membershipTierId?: number;
  latestBillingAmount?: number;
  startDate?: string;
  endDate?: string;
  latestBillingDate?: string;
  cancelledAt?: string;
}

interface PlanCardProps {
  subscriptionStatus: SubscriptionStatus | null;
  isSubLoading: boolean;
  onCancel: () => void;
  profile: UserProfile;
}

export const PlanCard = ({ subscriptionStatus, isSubLoading, onCancel, profile }: PlanCardProps) => {
  return (
    <div className="bg-container border-0 rounded-lg p-4 h-full">
      {isSubLoading ? (
        <div className="flex items-center">
          <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin mr-2" />
          <span className="text-muted-foreground">Checking subscription...</span>
        </div>
      ) : subscriptionStatus?.hasSubscription ? (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mb-1">Your plan</h2>
          <h1 className="text-2xl font-bold text-primary mb-1">
            {subscriptionStatus.status === 'ACTIVE' ? (
              ({
                1: 'Supporter Membership',
                2: 'Patron Membership',
                3: 'Super Patron Membership',
              } as Record<number, string>)[
                subscriptionStatus.membershipTierId ??
                  (subscriptionStatus.latestBillingAmount === 5
                    ? 1
                    : subscriptionStatus.latestBillingAmount === 9
                    ? 2
                    : subscriptionStatus.latestBillingAmount === 20
                    ? 3
                    : 0)
              ] || 'Membership'
            ) : (
              'Cancelled Membership'
            )}
          </h1>
          <p className="text-sm text-muted-foreground mb-3">
            {subscriptionStatus.status === 'CANCELLED' ? (
              `Your membership will continue `
            ) : (
              `Your next bill is ${
                subscriptionStatus.membershipTierId
                  ? `for $${({ 1: 5, 2: 9, 3: 20 } as Record<number, number>)[
                      subscriptionStatus.membershipTierId
                    ]}`
                  : subscriptionStatus.latestBillingAmount
                  ? `for $${subscriptionStatus.latestBillingAmount}`
                  : ''
              } ${
                subscriptionStatus.endDate
                  ? `on ${new Date(subscriptionStatus.endDate).toLocaleDateString()}`
                  : 'on your next billing date'
              }.`
            )}
            {subscriptionStatus.status === 'CANCELLED' && (
              <>
                <span className="underline">until</span>
                {` ${
                  subscriptionStatus.endDate
                    ? new Date(subscriptionStatus.endDate).toLocaleDateString()
                    : 'your current billing period end'
                }.`}
              </>
            )}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">PayPal</div>
            <div className="flex gap-2">
              {subscriptionStatus.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={onCancel}
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'User'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-xl font-semibold text-primary-foreground">
                  {profile.username ? profile.username[0].toUpperCase() : '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-lg text-foreground">{profile.username || 'Anonymous User'}</p>
                <p className="text-md text-muted-foreground">Coins: {profile.coins ?? 0}</p>
              </div>
            </div>
            <Link
              href="/shop?tab=coins"
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-center font-medium hover:bg-primary/90 transition-colors"
            >
              Top Up
            </Link>
          </div>
        </>
      )}
    </div>
  );
}; 