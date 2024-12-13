'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  popular?: boolean;
}

const coinPackages: CoinPackage[] = [
  { id: 1, coins: 10, price: 1 },
  { id: 2, coins: 50, price: 5, popular: true },
  { id: 3, coins: 100, price: 10 },
  { id: 4, coins: 200, price: 20 },
];

export default function ShopPage() {
  const { userId, isAuthenticated } = useAuth();
  const { userProfile } = useStreak(userId);
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [{ isPending, isInitial, isRejected, isResolved }] = usePayPalScriptReducer();

  useEffect(() => {
    console.log('PayPal Script Status:', {
      isPending,
      isInitial,
      isRejected,
      isResolved
    });
  }, [isPending, isInitial, isRejected, isResolved]);

  const handlePurchaseClick = async (pkg: CoinPackage) => {
    if (!isAuthenticated) {
      toast.error('Please create an account to buy coins');
      return;
    }
    setSelectedPackage(pkg);
  };


  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4 text-black">Coin Shop</h1>
        <div className="bg-amber-50 p-4 rounded-lg inline-flex items-center gap-2">
          <Icon icon="pepicons-print:coin" className="text-amber-600 text-xl" />
          <span className="font-medium text-black">
            Current Balance: {userProfile?.coins || 0} coins
          </span>
        </div>
        <p className="mt-3 text-gray-600 italic">
          We are working on getting the coins feature implemented
        </p>
      </div>

      {/* Purchase Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Complete Purchase</h2>
            <p className="mb-4">
              Purchase {selectedPackage.coins} coins for ${selectedPackage.price.toFixed(2)}
            </p>
            
            <div className="space-y-3">
              {isPending ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <PayPalButtons
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          value: selectedPackage.price.toString(),
                          currency_code: "USD"
                        },
                        custom_id: `${userId}:${selectedPackage.id}`
                      }]
                    });
                  }}
                  onApprove={async (data, actions) => {
                    if (actions.order) {
                      try {
                        const order = await actions.order.capture();
                        if (order.status === 'COMPLETED') {
                          toast.success('Payment successful! Adding coins to your account...');
                          await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
                          setSelectedPackage(null);
                        } else {
                          toast.error('Payment was not completed successfully');
                          console.error('Payment status:', order.status);
                        }
                      } catch (error) {
                        console.error('Payment capture error:', error);
                        toast.error('There was an error processing your payment');
                      }
                    }
                  }}
                  onError={(err) => {
                    console.error('PayPal error:', err);
                    toast.error('Payment failed. Please try again.');
                    setSelectedPackage(null);
                  }}
                  style={{ 
                    layout: "horizontal",
                    height: 48,
                  }}
                  disabled={false}
                />
              )}

              <button
                onClick={() => setSelectedPackage(null)}
                className="w-full mt-4 py-2 px-4 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {coinPackages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`
              relative border rounded-lg p-6 text-center
              ${pkg.popular ? 'border-amber-500 shadow-lg' : 'border-gray-200'}
              hover:shadow-md transition-shadow
            `}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="flex justify-center mb-4">
              <Icon icon="pepicons-print:coins" className="text-amber-500 text-4xl" />
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-black">{pkg.coins} Coins</h3>
            <p className="text-2xl font-bold text-amber-600 mb-4">
              ${pkg.price.toFixed(2)}
            </p>

            <button
              onClick={() => handlePurchaseClick(pkg)}
              disabled
              className={`
                w-full py-2 px-4 rounded-md font-medium
                ${pkg.popular 
                  ? 'bg-amber-300 cursor-not-allowed text-white' 
                  : 'bg-gray-100 cursor-not-allowed text-gray-400'}
                transition-colors
              `}
              title="PayPal integration coming soon!"
            >
              Coming Soon
            </button>
          </div>
        ))}
      </div>

    </div>
  );
} 