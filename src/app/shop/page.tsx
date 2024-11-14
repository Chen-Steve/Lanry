'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { OnApproveData, OnApproveActions } from '@paypal/paypal-js';
import { toast } from 'react-hot-toast';

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
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Query user's current coin balance
  const { data: userCoins, isLoading, isError, error } = useQuery({
    queryKey: ['userCoins'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data.coins;
    },
  });

  const queryClient = useQueryClient();

  const handlePaypalApprove = async (
    data: OnApproveData,
    pkg: CoinPackage
  ) => {
    setIsProcessing(true);
    try {
      // First verify the payment was successful
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Record the transaction
      const response = await fetch('/api/coins/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
          coins: pkg.coins,
          amount: pkg.price
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process transaction');
      }

      // Invalidate the coins query to refresh the balance
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      
      // Close the modal
      setSelectedPackage(null);

      // Show success message
      toast.success(`Successfully purchased ${pkg.coins} coins!`);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseClick = async (pkg: CoinPackage) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error('Please create an account to buy coins');
      return;
    }
    setSelectedPackage(pkg);
  };

  return (
    <PayPalScriptProvider options={{ 
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
      currency: "USD"
    }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4 text-black">Coin Shop</h1>
          <p className="text-black mb-4">
            Purchase coins to unlock advanced chapteres, premium features and support your favorite novels
          </p>
          <div className="bg-amber-50 p-4 rounded-lg inline-flex items-center gap-2">
            <Icon icon="pepicons-print:coin" className="text-amber-600 text-xl" />
            {isLoading ? (
              <span className="font-medium text-black">Loading balance...</span>
            ) : isError ? (
              <span className="text-red-500">Error loading balance: {error?.message}</span>
            ) : (
              <span className="font-medium text-black">Current Balance: {userCoins || 0} coins</span>
            )}
          </div>
        </div>

        {/* Updated Purchase Confirmation Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Complete Purchase</h2>
              <p className="mb-4">
                Purchase {selectedPackage.coins} coins for ${selectedPackage.price.toFixed(2)}
              </p>
              {isProcessing ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <PayPalButtons
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          currency_code: "USD",
                          value: selectedPackage.price.toString()
                        }
                      }]
                    });
                  }}
                  onApprove={(data: OnApproveData, actions: OnApproveActions) => {
                    return actions.order!.capture().then(() => {
                      handlePaypalApprove(data, selectedPackage);
                    });
                  }}
                  style={{ layout: "horizontal" }}
                />
              )}
              <button
                onClick={() => setSelectedPackage(null)}
                disabled={isProcessing}
                className={`
                  w-full mt-4 py-2 px-4 rounded-md transition-colors
                  ${isProcessing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-gray-200'}
                `}
              >
                Cancel
              </button>
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
              <p className="text-black text-sm mb-4">
                ${(pkg.price / pkg.coins * 100).toFixed(1)} cents per coin
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

        {/* How to Earn Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-black">Other Ways to Earn Coins (Coming Soon)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <Icon icon="pepicons-print:fire" className="text-3xl text-orange-500 mb-4" />
              <h3 className="font-bold mb-2 text-black">Daily Streak</h3>
              <p className="text-black">
                Maintain your daily reading streak to earn bonus coins
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <Icon icon="pepicons-print:text-bubble" className="text-3xl text-blue-500 mb-4" />
              <h3 className="font-bold mb-2 text-black">Write Reviews</h3>
              <p className="text-black">
                Earn coins by writing quality reviews for novels
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <Icon icon="pepicons-print:handshake" className="text-3xl text-green-500 mb-4" />
              <h3 className="font-bold mb-2 text-black">Share Novels</h3>
              <p className="text-black">
                Get coins when friends read novels you&apos;ve shared
              </p>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
} 