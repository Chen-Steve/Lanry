'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { onApprove } from "@/services/paymentService";
import { useRouter } from 'next/navigation';
// import { useAdFreeStatus } from '@/hooks/useAdFreeStatus';

export const coinPackages = [
  { id: 1, coins: 10, price: 1 },
  { id: 2, coins: 50, price: 5 }, // Commented out: , isAdFree: true
  { id: 3, coins: 100, price: 10 }, // Commented out: , isAdFree: true
  { id: 4, coins: 200, price: 20 }, // Commented out: , isAdFree: true
  { id: 5, coins: 600, price: 1, isBonus: true }, // Best value! 500 + 100 bonus coins
];

export default function Coins() {
  const { userId, isAuthenticated } = useAuth();
  // const { isAdFree } = useAdFreeStatus();
  const router = useRouter();

  return (
    <>
      {/* Commented out ad-free banner
      <div className={`${isAdFree ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-yellow-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'} border rounded-lg p-4 mb-6`}>
        <div className="flex gap-2 items-start">
          <Icon 
            icon={isAdFree ? "mdi:check-circle" : "mdi:information-outline"} 
            className={`${isAdFree ? 'text-emerald-500' : 'text-amber-500'} text-xl mt-0.5`} 
          />
          <div>
            <h3 className={`font-medium ${isAdFree ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {isAdFree ? 'Ad-Free Experience Active!' : 'Get Ad-Free Experience'}
            </h3>
            <p className={`text-sm ${isAdFree ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {isAdFree 
                ? 'You are currently enjoying an ad-free browsing experience across the entire site!' 
                : 'Purchase 50 or more coins to automatically receive an ad-free browsing experience.'}
            </p>
          </div>
        </div>
      </div>
      */}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {coinPackages.map((pkg) => (
          <div 
            key={pkg.id}
            className="border border-border rounded-lg p-4 text-center hover:shadow-md transition-shadow bg-background"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon icon="pepicons-print:coins" className="text-amber-500 text-2xl" />
              <h3 className="text-lg font-bold text-foreground">
                {pkg.id === 5 ? '500 + 100 Coins' : `${pkg.coins} Coins`}
              </h3>
            </div>
            
            <p className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-2">
              ${pkg.price.toFixed(2)}
            </p>

            {/* Commented out ad-free badge
            {pkg.isAdFree && (
              <div className="my-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Icon icon="mdi:check-circle" />
                <span>Ad-Free Experience</span>
              </div>
            )}
            */}
            
            <PayPalButtons
              style={{ layout: "horizontal", height: 35, tagline: false }}
              createOrder={async () => {
                try {
                  if (!isAuthenticated || !userId) {
                    throw new Error("Please sign in to make a purchase");
                  }

                  console.log("Making request with userId:", userId); // Debug log
                  const response = await fetch("/api/payments/create-order", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userId,
                      coins: pkg.coins,
                      amount: pkg.price,
                    }),
                    credentials: "include",
                  });

                  const data = await response.json();
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  if (!data.id) {
                    throw new Error("Failed to create order");
                  }
                  return data.id;
                } catch (error) {
                  console.error("Create order error:", error);
                  toast.error(error instanceof Error ? error.message : "Failed to create order");
                  throw error;
                }
              }}
              onApprove={async (data) => {
                try {
                  if (!userId) return;
                  await onApprove(userId, data.orderID);
                  toast.success(`Successfully purchased ${pkg.coins} coins!`);
                  router.refresh();
                } catch (error) {
                  console.error("Approve error:", error);
                  toast.error("Failed to complete purchase");
                }
              }}
              onError={(err) => {
                console.error("PayPal error:", err);
                toast.error("Payment failed");
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
} 