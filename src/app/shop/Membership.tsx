'use client';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

export const membershipTiers = [
  {
    id: 1,
    name: "Supporter",
    price: 4.99,
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
    price: 9.99,
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
    price: 19.99,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {membershipTiers.map((tier) => (
        <div 
          key={tier.id}
          className="border border-border rounded-lg p-6 text-center hover:shadow-md transition-shadow bg-background relative overflow-hidden"
        >

          
          <div className="mb-4">
            <div className="flex justify-center mb-3">
              <Icon icon={tier.icon} className={`text-4xl ${tier.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-primary">${tier.price}</span>
              <span className="text-muted-foreground">/{tier.billingPeriod}</span>
            </div>
          </div>
          
          <div className="h-[280px] flex flex-col items-start justify-start text-muted-foreground text-sm mb-4">
            <ul className="text-left space-y-2 w-full">
              {tier.perks.map((perk, index) => (
                <li key={index} className="flex items-start">
                  <Icon icon="mdi:check-circle" className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  {perk.highlight ? (
                    <span className="font-semibold text-primary underline">{perk.text}</span>
                  ) : (
                    <span>{perk.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

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
        </div>
      ))}
    </div>
  );
} 