'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import supabase from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

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

  // Query user's current coin balance
  const { data: userCoins } = useQuery({
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

  const handlePurchase = async (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    // Here you would integrate with your payment processor (Stripe, etc.)
    console.log('Processing purchase for package:', pkg);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Coin Shop</h1>
        <p className="text-gray-600 mb-4">
          Purchase coins to unlock advanced chapteres, premium features and support your favorite novels
        </p>
        <div className="bg-amber-50 p-4 rounded-lg inline-flex items-center gap-2">
          <Icon icon="pepicons-print:coin" className="text-amber-600 text-xl" />
          <span className="font-medium">Current Balance: {userCoins || 0} coins</span>
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Purchase</h2>
            <p className="mb-4">
              You are about to purchase {selectedPackage.coins} coins for ${selectedPackage.price.toFixed(2)}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedPackage(null)}
                className="flex-1 py-2 px-4 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Implement actual purchase logic here
                  console.log('Confirming purchase:', selectedPackage);
                  setSelectedPackage(null);
                }}
                className="flex-1 py-2 px-4 rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                Confirm
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
            
            <h3 className="text-xl font-bold mb-2">{pkg.coins} Coins</h3>
            <p className="text-2xl font-bold text-amber-600 mb-4">
              ${pkg.price.toFixed(2)}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              ${(pkg.price / pkg.coins * 100).toFixed(1)} cents per coin
            </p>
            
            <button
              onClick={() => handlePurchase(pkg)}
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
        <h2 className="text-2xl font-bold mb-6">Other Ways to Earn Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <Icon icon="pepicons-print:fire" className="text-3xl text-orange-500 mb-4" />
            <h3 className="font-bold mb-2">Daily Streak</h3>
            <p className="text-gray-600">
              Maintain your daily reading streak to earn bonus coins
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <Icon icon="pepicons-print:text-bubble" className="text-3xl text-blue-500 mb-4" />
            <h3 className="font-bold mb-2">Write Reviews</h3>
            <p className="text-gray-600">
              Earn coins by writing quality reviews for novels
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <Icon icon="pepicons-print:handshake" className="text-3xl text-green-500 mb-4" />
            <h3 className="font-bold mb-2">Share Novels</h3>
            <p className="text-gray-600">
              Get coins when friends read novels you&apos;ve shared
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 