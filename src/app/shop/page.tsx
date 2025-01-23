'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { onApprove } from "@/services/paymentService";
import { useRouter } from 'next/navigation';

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
}

const coinPackages: CoinPackage[] = [
  { id: 1, coins: 10, price: 1 },
  { id: 2, coins: 50, price: 5, },
  { id: 3, coins: 100, price: 10 },
  { id: 4, coins: 200, price: 20 },
];

export default function ShopPage() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Coin Shop</h1>
      </div>

      <PayPalScriptProvider options={initialOptions}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coinPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className="border border-border rounded-lg p-4 text-center hover:shadow-md transition-shadow bg-background"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Icon icon="pepicons-print:coins" className="text-amber-500 text-2xl" />
                <h3 className="text-lg font-bold text-foreground">{pkg.coins} Coins</h3>
              </div>
              
              <p className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-3">
                ${pkg.price.toFixed(2)}
              </p>

              {isAuthenticated && userId ? (
                <PayPalButtons
                  style={{ layout: "horizontal", height: 35 }}
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
              ) : (
                <button
                  className="bg-muted text-muted-foreground cursor-not-allowed w-full py-1.5 px-3 rounded-md text-sm font-medium"
                  disabled
                >
                  Sign in to purchase
                </button>
              )}
            </div>
          ))}
        </div>
      </PayPalScriptProvider>
    </div>
  );
} 