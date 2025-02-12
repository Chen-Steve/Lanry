'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { onApprove } from "@/services/paymentService";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  useEffect(() => {
    // Load Coinbase Commerce script
    const script = document.createElement('script');
    script.src = 'https://commerce.coinbase.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
    enabled: isAuthenticated && isClientLoaded,
  };

  if (!isAuthenticated || !userId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Please create an account or sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Coin Shop</h1>
        <p className="text-sm text-muted-foreground">
          🎉 Limited time: Get 1 bonus coin when paying with crypto! (Beta feature - coins may take up to 6 hours to arrive)
        </p>
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

              <div className="flex flex-col gap-2">
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

                <button
                  className="flex items-center justify-center gap-2 bg-[#0052FF] text-white px-4 py-2 rounded-md hover:bg-[#0039B3] transition-colors"
                  onClick={() => {
                    let checkoutUrl;
                    switch (pkg.price) {
                      case 5:
                        checkoutUrl = `https://commerce.coinbase.com/checkout/1d4a966f-acd1-45d1-808d-4ca279bac74a?custom=${userId}&coins=${pkg.coins + 1}`;
                        break;
                      case 10:
                        checkoutUrl = `https://commerce.coinbase.com/checkout/e2bf66ec-d7f2-4234-bf29-8bbabc468db3?custom=${userId}&coins=${pkg.coins + 1}`;
                        break;
                      case 20:
                        checkoutUrl = `https://commerce.coinbase.com/checkout/0b16e919-5e22-4f90-9ec6-a3f83f6d2156?custom=${userId}&coins=${pkg.coins + 1}`;
                        break;
                      default:
                        return; // Don't show crypto option for $1
                    }
                    if (checkoutUrl) {
                      window.open(checkoutUrl, '_blank');
                      toast.success('Crypto payment window opened. You will receive your coins + 1 bonus coin within 6 hours after confirmation.');
                    }
                  }}
                  style={{ display: pkg.price === 1 ? 'none' : undefined }}
                >
                  <Icon icon="simple-icons:coinbase" className="text-xl" />
                  Pay with Crypto
                </button>
              </div>
            </div>
          ))}
        </div>
      </PayPalScriptProvider>

      <div className="mt-8 text-center text-muted-foreground">
        <p className="text-sm">
          Questions or issues with your funds? Contact us on{' '}
          <a href="https://discord.gg/DXHRpV3sxF" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            Discord
          </a>
          {' '}or email us at{' '}
          <a href="mailto:c.niasser@gmail.com" className="text-primary hover:underline">
            c.niasser@gmail.com
          </a>
          {' '}for support.
        </p>
      </div>
    </div>
  );
} 