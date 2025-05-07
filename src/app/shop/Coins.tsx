'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { onApprove } from "@/services/paymentService";
import { useRouter } from 'next/navigation';

export const coinPackages = [
  { id: 1, coins: 10, price: 1 },
  { id: 2, coins: 50, price: 5, },
  { id: 3, coins: 100, price: 10 },
  { id: 4, coins: 200, price: 20 },
  { id: 5, coins: 600, price: 50, isBonus: true }, // Best value! 500 + 100 bonus coins
];

export default function Coins() {
  const { userId, isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {coinPackages.map((pkg) => (
        <div 
          key={pkg.id}
          className="border border-border rounded-lg p-4 text-center hover:shadow-md transition-shadow bg-background"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon icon="pepicons-print:coins" className="text-amber-500 text-2xl" />
            <h3 className="text-lg font-bold text-foreground">
              {pkg.isBonus ? (
                <span>500 + <span className="text-green-500">100 Bonus</span></span>
              ) : (
                `${pkg.coins} Coins`
              )}
            </h3>
          </div>
          
          <p className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-3">
            ${pkg.price.toFixed(2)}
          </p>

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
  );
} 