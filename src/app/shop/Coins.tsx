'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { onApprove } from "@/services/paymentService";
import { useRouter } from 'next/navigation';
import { FUNDING } from "@paypal/react-paypal-js";
// import { useAdFreeStatus } from '@/hooks/useAdFreeStatus';

export const coinPackages = [
  { id: 1, coins: 20, price: 2, coinsPerDollar: Math.round(20/2) },
  { id: 2, coins: 100, price: 10, coinsPerDollar: Math.round(100/10), tag: "POPULAR" },
  { id: 3, coins: 200, price: 20, coinsPerDollar: Math.round(200/20) },
  { id: 4, coins: 300, price: 25, coinsPerDollar: Math.round(300/25), tag: "BEST VALUE" },
  { id: 5, coins: 600, price: 50, coinsPerDollar: Math.round(600/50), isBonus: true }, // 500 + 100 bonus
  { id: 6, coins: 1950, price: 150, coinsPerDollar: Math.round(1950/150) }, // Price anchor, 13 coins per dollar
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {coinPackages.slice(0, 3).map((pkg) => (
          <div 
            key={pkg.id}
            className={`border border-border rounded-lg p-4 text-center hover:shadow-md transition-shadow bg-background
              ${pkg.tag === "BEST VALUE" ? 'border-emerald-500 border-2' : ''}
              ${pkg.tag === "POPULAR" ? 'border-amber-500 border-2' : ''}`}
          >
            {pkg.tag ? (
              <div className={`text-xs font-semibold mb-2 py-1 px-2 rounded-full inline-block
                ${pkg.tag === "BEST VALUE" ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                ${pkg.tag === "POPULAR" ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}`}>
                {pkg.tag}
              </div>
            ) : (
              <div className="mb-2 py-1 px-2 invisible">Spacer</div>
            )}
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon icon="pepicons-print:coins" className="text-amber-500 text-xl" />
                {pkg.id === 5 ? (
                  <>
                    500 <span className="text-emerald-500">+ 100</span>
                  </>
                ) : pkg.coins}
                <span className="text-amber-500">coins</span>
              </h3>
            </div>
            
            <p className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-3 flex items-center justify-center gap-2">
              ${pkg.price}
              <span className="text-xs font-normal text-muted-foreground">
                ({pkg.coinsPerDollar} coins per $1)
              </span>
            </p>

            <PayPalButtons
              fundingSource={FUNDING.PAYPAL}
              style={{ layout: "horizontal", height: 35, tagline: false }}
              createOrder={async () => {
                try {
                  if (!isAuthenticated || !userId) {
                    throw new Error("Please sign in to make a purchase");
                  }

                  console.log("Making request with userId:", userId);
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
        
        {/* Second row */}
        {coinPackages.slice(3).map((pkg) => (
          <div 
            key={pkg.id}
            className={`border border-border rounded-lg p-4 text-center hover:shadow-md transition-shadow bg-background
              ${pkg.tag === "BEST VALUE" ? 'border-emerald-500 border-2' : ''}
              ${pkg.tag === "POPULAR" ? 'border-amber-500 border-2' : ''}`}
          >
            {pkg.tag ? (
              <div className={`text-xs font-semibold mb-2 py-1 px-2 rounded-full inline-block
                ${pkg.tag === "BEST VALUE" ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                ${pkg.tag === "POPULAR" ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}`}>
                {pkg.tag}
              </div>
            ) : (
              <div className="mb-2 py-1 px-2 invisible">Spacer</div>
            )}
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon icon="pepicons-print:coins" className="text-amber-500 text-xl" />
                {pkg.id === 5 ? (
                  <>
                    500 <span className="text-emerald-500">+ 100</span>
                  </>
                ) : pkg.coins}
                <span className="text-amber-500">coins</span>
              </h3>
            </div>
            
            <p className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-3 flex items-center justify-center gap-2">
              ${pkg.price}
              <span className="text-xs font-normal text-muted-foreground">
                ({pkg.coinsPerDollar} coins per $1)
              </span>
            </p>

            <PayPalButtons
              fundingSource={FUNDING.PAYPAL}
              style={{ layout: "horizontal", height: 35, tagline: false }}
              createOrder={async () => {
                try {
                  if (!isAuthenticated || !userId) {
                    throw new Error("Please sign in to make a purchase");
                  }

                  console.log("Making request with userId:", userId);
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