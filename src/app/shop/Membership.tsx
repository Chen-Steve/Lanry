'use client';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

export const membershipTiers = [
  {
    id: 1,
    name: "Supporter",
    price: 5,
    billingPeriod: "month",
    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    perks: [
      { text: "Ad-free experience", highlight: true },
      { text: "Supporter badge on profile", highlight: false },
      { text: "New Wallpapers every week", highlight: false },
      { text: "5 Profile Borders", highlight: false }
    ],
    iconColor: "text-blue-400",
    icon: "material-symbols:verified-outline"
  },
  {
    id: 2,
    name: "Patron",
    price: 9,
    billingPeriod: "month",
    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    perks: [
      { text: "Everything in Supporter", highlight: false },
      { text: <><span className="underline">5%</span> discount on coin purchases</>, highlight: false },
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
    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    perks: [
      { text: "Everything in Patron", highlight: false },  
      { text: <>200 + <span className="text-green-500">100</span> monthly bonus coins</>, highlight: true },
      { text: "Audio for all Chapters", highlight: true },
      { text: <><span className="underline">20%</span> discount on coin purchases</>, highlight: false },
      { text: "Name in supporter credits", highlight: false },
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {membershipTiers.map((tier) => {
        const isCurrentTier = subscriptionStatus?.membershipTierId === tier.id;

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

            <button 
              className="w-full py-2 px-4 bg-primary/20 text-primary rounded-lg cursor-not-allowed hover:bg-primary/25 transition-colors"
              disabled
            >
              Coming Soon
            </button>
          </div>
        );
      })}
    </div>
  );
}