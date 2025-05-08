'use client';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from 'next/navigation';
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
      { text: "60 monthly bonus coins", highlight: false },
      { text: "Supporter badge on profile", highlight: false },
      { text: "5% discount on coin purchases", highlight: false }
    ],
    iconColor: "text-blue-400",
    icon: "material-symbols:verified-outline"
  },
  {
    id: 2,
    name: "Premium",
    price: 9,
    billingPeriod: "month",
    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    perks: [
      { text: "Everything in Supporter", highlight: false },
      { text: "150 monthly bonus coins", highlight: false },
      { text: "Audio for all Chapters", highlight: true },
      { text: "10% discount on coin purchases", highlight: false },
      { text: "Super Patron badge on profile", highlight: false }
    ],
    iconColor: "text-purple-500",
    icon: "material-symbols:diamond"
  },
  {
    id: 3,
    name: "VIP",
    price: 20,
    billingPeriod: "month",
    planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    perks: [
      { text: "Everything in Premium", highlight: false },  
      { text: "400 monthly bonus coins", highlight: false },
      { text: "20% discount on coin purchases", highlight: false },
      { text: "Name in supporter credits", highlight: false },
      { text: "VIP badge on profile", highlight: false }
    ],
    iconColor: "text-amber-500",
    icon: "material-symbols:star-rounded"
  }
];

export default function Membership() {
  const { userId, isAuthenticated } = useAuth();
  const router = useRouter();
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
        const hasActiveSubscription = subscriptionStatus?.hasSubscription && subscriptionStatus?.status === 'ACTIVE';

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

            {isCurrentTier ? (
              <div className="space-y-2">
                <div className="bg-card dark:bg-zinc-900 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Current Plan
                  </p>
                </div>
              </div>
            ) : hasActiveSubscription && tier.id > (subscriptionStatus?.membershipTierId || 0) ? (
              <>
                <PayPalButtons
                  style={{ layout: "horizontal", height: 35, tagline: false, shape: 'pill', color: 'white' }}
                  forceReRender={[tier.id, tier.planId, tier.price]}
                  createSubscription={(data, actions) => {
                    try {
                      if (!isAuthenticated || !userId) {
                        toast.error("Please sign in to subscribe");
                        throw new Error("Please sign in to subscribe");
                      }
                      
                      return actions.subscription.create({
                        plan_id: tier.planId,
                        custom_id: userId,
                      });
                    } catch (error) {
                      console.error("Create subscription error:", error);
                      toast.error(error instanceof Error ? error.message : "Failed to create subscription");
                      throw error;
                    }
                  }}
                  onApprove={async (data) => {
                    try {
                      if (!userId) return;
                      
                      // Call our backend to record the subscription
                      const response = await fetch("/api/subscriptions/record", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          userId,
                          subscriptionId: data.subscriptionID,
                          membershipTierId: tier.id,
                        }),
                        credentials: "include",
                      });
                      
                      const result = await response.json();
                      if (result.error) {
                        throw new Error(result.error);
                      }
                      
                      toast.success(`Successfully upgraded to ${tier.name} membership!`);
                      router.refresh();
                    } catch (error) {
                      console.error("Subscription upgrade error:", error);
                      toast.error("Failed to upgrade subscription");
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast.error("Subscription upgrade failed");
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">Upgrade to access more features</p>
              </>
            ) : hasActiveSubscription ? (
              <>
                <PayPalButtons
                  style={{ layout: "horizontal", height: 35, tagline: false, shape: 'pill', color: 'white' }}
                  forceReRender={[tier.id, tier.planId, tier.price]}
                  createSubscription={(data, actions) => {
                    try {
                      if (!isAuthenticated || !userId) {
                        toast.error("Please sign in to subscribe");
                        throw new Error("Please sign in to subscribe");
                      }
                      
                      return actions.subscription.create({
                        plan_id: tier.planId,
                        custom_id: userId,
                      });
                    } catch (error) {
                      console.error("Create subscription error:", error);
                      toast.error(error instanceof Error ? error.message : "Failed to create subscription");
                      throw error;
                    }
                  }}
                  onApprove={async (data) => {
                    try {
                      if (!userId) return;
                      
                      // Call our backend to record the subscription
                      const response = await fetch("/api/subscriptions/record", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          userId,
                          subscriptionId: data.subscriptionID,
                          membershipTierId: tier.id,
                        }),
                        credentials: "include",
                      });
                      
                      const result = await response.json();
                      if (result.error) {
                        throw new Error(result.error);
                      }
                      
                      toast.success(`Successfully switched to ${tier.name} membership!`);
                      router.refresh();
                    } catch (error) {
                      console.error("Subscription switch error:", error);
                      toast.error("Failed to switch subscription");
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast.error("Subscription switch failed");
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">Switch to this plan</p>
              </>
            ) : (
              <>
                <PayPalButtons
                  style={{ layout: "horizontal", height: 35, tagline: false, shape: 'pill', color: 'white' }}
                  forceReRender={[tier.id, tier.planId, tier.price]}
                  createSubscription={(data, actions) => {
                    try {
                      if (!isAuthenticated || !userId) {
                        toast.error("Please sign in to subscribe");
                        throw new Error("Please sign in to subscribe");
                      }
                      
                      return actions.subscription.create({
                        plan_id: tier.planId,
                        custom_id: userId,
                      });
                    } catch (error) {
                      console.error("Create subscription error:", error);
                      toast.error(error instanceof Error ? error.message : "Failed to create subscription");
                      throw error;
                    }
                  }}
                  onApprove={async (data) => {
                    try {
                      if (!userId) return;
                      
                      // Call our backend to record the subscription
                      const response = await fetch("/api/subscriptions/record", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          userId,
                          subscriptionId: data.subscriptionID,
                          membershipTierId: tier.id,
                        }),
                        credentials: "include",
                      });
                      
                      const result = await response.json();
                      if (result.error) {
                        throw new Error(result.error);
                      }
                      
                      toast.success(`Successfully subscribed to ${tier.name} membership!`);
                      router.refresh();
                    } catch (error) {
                      console.error("Subscription approval error:", error);
                      toast.error("Failed to complete subscription");
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast.error("Subscription failed");
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">Cancel anytime</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
} 