'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PayPalButtons, usePayPalScriptReducer, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { onApprove } from "@/services/paymentService";
import { useRouter } from 'next/navigation';
import { FUNDING } from "@paypal/react-paypal-js";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { UserProfile } from '@/types/database';

// import { useAdFreeStatus } from '@/hooks/useAdFreeStatus';

export const coinPackages = [
  { id: 1, coins: 20, price: 2, coinsPerDollar: Math.round(20/2) },
  { id: 2, coins: 50, price: 5, coinsPerDollar: Math.round(50/5) },
  { id: 3, coins: 100, price: 10, coinsPerDollar: Math.round(100/10), tag: "POPULAR" },
  { id: 4, coins: 200, price: 20, coinsPerDollar: Math.round(200/20) },
  { id: 5, coins: 300, price: 25, coinsPerDollar: Math.round(300/25), tag: "BEST VALUE" },
  { id: 6, coins: 600, price: 50, coinsPerDollar: Math.round(600/50), isBonus: true }, // 500 + 100 bonus
  { id: 7, coins: 1950, price: 150, coinsPerDollar: Math.round(1950/150) }, // Price anchor, 13 coins per dollar
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: typeof coinPackages[0];
  userId: string;
  isAuthenticated: boolean;
}

function PaymentModal({ isOpen, onClose, pkg, userId, isAuthenticated }: PaymentModalProps) {
  const router = useRouter();
  const [isModalReady, setIsModalReady] = useState(false);
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  
  // Fetch user profile to check Wise tag
  const { data: userProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!userId && isOpen,
  });
  
  // Map coin packages to your Wise payment links
  const wisePaymentLinks: Record<number, string> = {
    5: "https://wise.com/pay/r/X-RSMGbYCySkEZ8",
    10: "https://wise.com/pay/r/OkqW7NRk5t4oyUE", 
    20: "https://wise.com/pay/r/zhtbfDXkHuCrpvw",
    25: "https://wise.com/pay/r/qcORAIo2QnST6tw",
    50: "https://wise.com/pay/r/StC1UzfJmyBWfVY",
    150: "https://wise.com/pay/r/GRxFRY5YeuwZ1U0"
  };

  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, PayPal script status:", { isPending, isResolved });
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        setIsModalReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsModalReady(false);
    }
  }, [isOpen, isPending, isResolved]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Purchase Coins</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
          <Icon icon="pepicons-print:coins" className="text-amber-500 text-2xl" />
          <div>
            <div className="font-semibold">
              {pkg.id === 6 ? (
                <>
                  500 <span className="text-emerald-500">+ 100</span> coins
                </>
              ) : (
                `${pkg.coins} coins`
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              ${pkg.price} ({pkg.coinsPerDollar} coins per $1)
            </div>
          </div>
        </div>

                <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Choose Payment Method</label>
            {isModalReady && isResolved ? (
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NODE_ENV === 'production'
                    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
                    : (process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)!,
                  currency: "USD",
                  components: "buttons,marks",
                  intent: "capture", // Force capture mode for coin purchases
                }}
              >
                <PayPalButtons
                key={`paypal-${pkg.id}`}
                fundingSource={FUNDING.PAYPAL}
                style={{ layout: "horizontal", height: 40, tagline: false }}
                createOrder={async () => {
                  try {
                    if (!isAuthenticated || !userId) {
                      throw new Error("Please sign in to make a purchase");
                    }

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
                  onClose();
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
              </PayPalScriptProvider>
            ) : (
              <div className="h-10 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  {isPending ? "Loading PayPal..." : "PayPal Loading..."}
                </span>
              </div>
            )}
          </div>
          
          {pkg.price >= 5 && wisePaymentLinks[pkg.price] && (
            <div className="space-y-2">
              {userProfile?.wise_tag && userProfile.wise_tag.trim() ? (
                <a
                  href={wisePaymentLinks[pkg.price]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full relative bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 hover:from-green-600 hover:via-emerald-600 hover:to-green-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-center shadow-sm hover:shadow-md"
                  onClick={onClose}
                >
                  <Icon icon="simple-icons:wise" className="text-white h-5 w-5" />
                  Pay with Wise
                </a>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    toast.info('Please connect your Wise tag in your profile to use Wise payments');
                    router.push('/user-dashboard');
                  }}
                  className="w-full relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-600 hover:via-orange-600 hover:to-amber-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-center shadow-sm hover:shadow-md"
                >
                  <Icon icon="simple-icons:wise" className="text-white h-5 w-5" />
                  Connect Wise Tag
                </button>
              )}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon icon="heroicons:clock" className="text-amber-600 text-sm mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-medium mb-1">Wise Payment Notice</p>
                    <p>• Coins will be credited within 1 hour (not instant)</p>
                    <p>• {userProfile?.wise_tag ? 'Your Wise tag is connected' : 'You need to connect your Wise tag first'}</p>
                    <p>• PayPal payments are instant if you prefer</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Coins() {
  const { userId, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<typeof coinPackages[0] | null>(null);

  const handleBuyClick = (pkg: typeof coinPackages[0]) => {
    if (!isAuthenticated || !userId) {
      toast.error("Please sign in to make a purchase");
      return;
    }
    setSelectedPackage(pkg);
  };

  return (
    <>
      <div className="space-y-3">
        {coinPackages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`border border-border rounded-lg p-4 bg-background hover:shadow-md transition-shadow
              ${pkg.tag === "BEST VALUE" ? 'border-emerald-500 border-2' : ''}
              ${pkg.tag === "POPULAR" ? 'border-amber-500 border-2' : ''}`}
          >
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Icon icon="pepicons-print:coins" className="text-amber-500 text-2xl" />
                  <div>
                    <div className="font-semibold text-lg">
                      {pkg.id === 6 ? (
                        <>
                          500 <span className="text-emerald-500">+ 100</span>
                        </>
                      ) : pkg.coins}
                      <span className="text-amber-500 ml-1">coins</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${pkg.price} ({pkg.coinsPerDollar} coins per $1)
                    </div>
                  </div>
                </div>
                {pkg.tag && (
                  <div className={`text-xs font-semibold py-1 px-2 rounded-full
                    ${pkg.tag === "BEST VALUE" ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                    ${pkg.tag === "POPULAR" ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}`}>
                    {pkg.tag}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleBuyClick(pkg)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Buy Now
              </button>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon icon="pepicons-print:coins" className="text-amber-500 text-xl" />
                  <div>
                    <div className="font-semibold">
                      {pkg.id === 6 ? (
                        <>
                          500 <span className="text-emerald-500">+ 100</span>
                        </>
                      ) : pkg.coins}
                      <span className="text-amber-500 ml-1">coins</span>
                    </div>
                    {pkg.tag && (
                      <div className={`text-xs font-semibold inline-block
                        ${pkg.tag === "BEST VALUE" ? 'text-emerald-600' : ''}
                        ${pkg.tag === "POPULAR" ? 'text-amber-600' : ''}`}>
                        {pkg.tag}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleBuyClick(pkg)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  ${pkg.price}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPackage && (
        <PaymentModal
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          pkg={selectedPackage}
          userId={userId || ''}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
} 