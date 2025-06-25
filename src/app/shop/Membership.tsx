'use client';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
// import { PayPalButtons, FUNDING } from "@paypal/react-paypal-js";
// import { useRouter } from 'next/navigation';

// In production we reuse a single PayPal plan for every tier (NEXT_PUBLIC_PAYPAL_PLAN_ID).
// In local development, you can still supply sandbox-specific plan IDs per tier.
const livePlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;

const planIds = {
  supporter: process.env.NODE_ENV === 'production'
    ? livePlanId
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_SUPPORTER_PLAN_ID,
  patron: process.env.NODE_ENV === 'production'
    ? livePlanId
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_PATRON_PLAN_ID,
  super: process.env.NODE_ENV === 'production'
    ? livePlanId
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_SUPER_PLAN_ID,
} as const;

/**
 * Ensure all required plan IDs are present. If any is missing, log a clear warning so
 * developers can add the plan ID to their env.local or production environment.
 */
if (process.env.NODE_ENV !== 'production') {
  (Object.entries(planIds) as [string, string | undefined][]).forEach(([tier, id]) => {
    if (!id) {
      console.warn(`PayPal sandbox plan ID for '${tier}' tier is missing. Set NEXT_PUBLIC_PAYPAL_SANDBOX_${tier.toUpperCase()}_PLAN_ID in env.local.`);
    }
  });
}

export const membershipTiers = [
  {
    id: 1,
    name: "Supporter",
    price: 5,
    billingPeriod: "month",
    planId: planIds.supporter!,
    perks: [
      { text: "Supporter badge on profile", highlight: false },
      { text: "5 Wallpapers every week", highlight: false },
      { text: "5 Profile Borders", highlight: false },
      { text: "55 coins per month", highlight: false }
    ],
    iconColor: "text-blue-400",
    icon: "material-symbols:verified-outline"
  },
  {
    id: 2,
    name: "Patron",
    price: 9,
    billingPeriod: "month",
    planId: planIds.patron!,
    perks: [
      { text: "Everything in Supporter", highlight: false },
      { text: <><span className="underline">5%</span> discount on ALL coin purchases</>, highlight: false },
      { text: "Patron badge on profile", highlight: false }
    ],
    iconColor: "text-purple-500",
    icon: "material-symbols:diamond"
  },
  {
    id: 3,
    name: "Super Patron",
    price: 20,
    billingPeriod: "month",
    planId: planIds.super!,
    perks: [
      { text: "Everything in Patron", highlight: false },  
      { text: <>200 + <span className="text-green-500">100</span> monthly bonus coins</>, highlight: true },
      { text: "Audio for all Chapters", highlight: true },
      { text: <><span className="underline">20%</span> discount on coin purchases</>, highlight: false },
      { text: "Name in Hall of Fame", highlight: false },
      { text: "Super Patron badge on profile", highlight: false }
    ],
    iconColor: "text-amber-500",
    icon: "material-symbols:star-rounded"
  }
];

export default function Membership() {
  const { userId } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<null | {
    hasSubscription: boolean;
    status?: string;
    plan?: string;
    startDate?: string;
    endDate?: string;
    membershipTierId?: number;
  }>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter();

  // Helper flags for UI logic
  const earlyCancelled = subscriptionStatus?.status === 'CANCELLED' && subscriptionStatus?.endDate ? new Date(subscriptionStatus.endDate) > new Date() : false;

  // Determine if the user is still in the current paid period
  const inCurrentPaidPeriodGlobal = subscriptionStatus?.endDate ? new Date(subscriptionStatus.endDate) > new Date() : false;

  // If the user cancelled early and the period is still active, block new subscriptions on all tiers
  const tooEarlyResubscribe = subscriptionStatus?.status === 'CANCELLED' && inCurrentPaidPeriodGlobal;

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/subscriptions/status?userId=${userId}`);
        const data = await res.json();
        setSubscriptionStatus(data);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        toast.error('Failed to load subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {earlyCancelled && (
        <div className="mb-4 p-4 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          You&apos;ve cancelled your membership. Your benefits last until {new Date(subscriptionStatus!.endDate!).toLocaleDateString()}. You can re-subscribe after that date.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {membershipTiers.map((tier) => {
          const isCurrentTier = subscriptionStatus?.membershipTierId === tier.id;
          const inCurrentPaidPeriod = inCurrentPaidPeriodGlobal;
          const shouldDisableSubscribe = tooEarlyResubscribe || (isCurrentTier && inCurrentPaidPeriod);

          return (
            <div 
              key={tier.id}
              className="border border-border rounded-lg p-4 text-center transition-all bg-background relative overflow-hidden hover:shadow-md"
            >
              {isCurrentTier && (
                <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground py-1 text-sm font-medium">
                  Current Plan
                </div>
              )}
              
              <div className={`mb-3 ${isCurrentTier ? 'mt-5' : ''}`}>
                <div className="flex justify-center mb-2">
                  <Icon icon={tier.icon} className={`text-3xl ${tier.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xl font-bold text-primary">${tier.price}</span>
                  <span className="text-muted-foreground">/{tier.billingPeriod}</span>
                </div>
              </div>
              
              <div className="h-[200px] flex flex-col items-start justify-start text-muted-foreground text-sm mb-3">
                <ul className="text-left space-y-1.5 w-full">
                  {tier.perks.map((perk, index) => (
                    <li key={index} className="flex items-start">
                      <Icon 
                        icon="mdi:check-circle"
                        className="text-green-500 mr-2 flex-shrink-0 mt-0.5 text-base"
                      />
                      {perk.highlight ? (
                        <span className="font-semibold text-primary underline text-sm">{perk.text}</span>
                      ) : (
                        <span className="text-sm">{perk.text}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {shouldDisableSubscribe ? (
                <button 
                  className="w-full py-2 px-4 bg-primary/20 text-primary rounded-lg cursor-not-allowed hover:bg-primary/25 transition-colors"
                  disabled
                >
                  {tooEarlyResubscribe
                    ? 'Available After Current Period'
                    : subscriptionStatus?.status === 'ACTIVE' && isCurrentTier
                      ? 'Current Plan'
                      : 'Already Active'}
                </button>
              ) : (
                <>
                  {/* 
                  <PayPalButtons
                    fundingSource={FUNDING.PAYPAL}
                    style={{ layout: "horizontal", height: 35, tagline: false }}
                    createSubscription={(_data, actions) => {
                      if (!isAuthenticated || !userId) {
                        toast.error('Please sign in to subscribe');
                        return Promise.reject('Not authenticated');
                      }
                      return actions.subscription.create({
                        plan_id: tier.planId,
                      });
                    }}
                    onApprove={async (data) => {
                      try {
                        if (!data.subscriptionID || !userId) return;
                        const res = await fetch('/api/subscriptions/record', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId,
                            subscriptionId: data.subscriptionID,
                            membershipTierId: tier.id,
                          }),
                          credentials: 'include',
                        });
                        const json = await res.json();
                        if (json.error) throw new Error(json.error);
                        toast.success('Subscription activated!');
                        router.refresh();
                      } catch (error) {
                        console.error('Subscription record error:', error);
                        toast.error('Failed to activate subscription');
                      }
                    }}
                    onError={(err) => {
                      console.error('PayPal subscription error:', err);
                      toast.error('Subscription failed');
                    }}
                  />
                  */}
                  <button
                    className="w-full py-2 px-4 bg-primary/20 text-primary rounded-lg cursor-not-allowed hover:bg-primary/25 transition-colors"
                    disabled
                  >
                    Coming Soon
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}