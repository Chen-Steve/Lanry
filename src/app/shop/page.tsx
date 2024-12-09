'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import supabase from '@/lib/supabaseClient';

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

  const handlePurchaseClick = async (pkg: CoinPackage) => {
    if (!isAuthenticated) {
      toast.error('Please create an account to buy coins');
      return;
    }
    setSelectedPackage(pkg);
  };

  const handlePaypalSuccess = async (orderId: string, packageId: number) => {
    if (!userId) {
      toast.error('Please log in to complete the purchase');
      return;
    }

    const selectedPkg = coinPackages.find(pkg => pkg.id === packageId);
    if (!selectedPkg) {
      toast.error('Invalid package selected');
      return;
    }

    try {
      // Verify session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to complete the purchase');
        return;
      }

      console.log('Sending purchase request:', {
        userId,
        amount: selectedPkg.coins,
        orderId,
        type: 'PURCHASE'
      });

      const response = await fetch('/api/coins/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: selectedPkg.coins,
          orderId,
          type: 'PURCHASE'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Purchase error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Purchase successful:', result);

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success(`Successfully purchased ${selectedPkg.coins} coins!`);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Error updating coins:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update coin balance');
    }
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
              <PayPalButtons
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{
                      amount: {
                        value: selectedPackage.price.toString(),
                        currency_code: "USD"
                      }
                    }]
                  });
                }}
                onApprove={async (data, actions) => {
                  if (actions.order) {
                    const order = await actions.order.capture();
                    if (order.id) {
                      await handlePaypalSuccess(order.id, selectedPackage.id);
                    }
                  }
                }}
                onError={() => {
                  toast.error('PayPal transaction failed');
                }}
                style={{ layout: "horizontal" }}
              />

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
              className={`
                w-full py-2 px-4 rounded-md font-medium
                ${pkg.popular 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                transition-colors
              `}
            >
              Purchase
            </button>
          </div>
        ))}
      </div>

    </div>
  );
} 