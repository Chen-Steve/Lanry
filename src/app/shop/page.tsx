'use client';

import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  kofiCode: string;
  popular?: boolean;
}

const coinPackages: CoinPackage[] = [
  { id: 1, coins: 10, price: 1, kofiCode: 'Support1' },
  { id: 2, coins: 50, price: 5, kofiCode: 'Support5', popular: true },
  { id: 3, coins: 100, price: 10, kofiCode: 'Support10' },
  { id: 4, coins: 200, price: 20, kofiCode: 'Support20' },
];

export default function ShopPage() {
  const { userId, isAuthenticated } = useAuth();

  // Simple query for user's coin balance
  const { data: userProfile } = useQuery({
    queryKey: ['shop-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const handlePurchaseClick = async (pkg: CoinPackage) => {
    if (!isAuthenticated) {
      toast.error('Please create an account to buy coins');
      return;
    }
    
    // Open Ko-fi in a new window
    const kofiUrl = `https://ko-fi.com/YOUR_KOFI_USERNAME/${pkg.kofiCode}`;
    window.open(kofiUrl, '_blank');
    
    toast.success('Redirecting to Ko-fi for purchase. Your coins will be credited once the payment is complete.');
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
                  ? 'bg-[#29abe0] hover:bg-[#228db8] text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                transition-colors
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon icon="simple-icons:kofi" className="text-xl" />
                Support on Ko-fi
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 