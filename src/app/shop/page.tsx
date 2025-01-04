'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

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
  const { isAuthenticated } = useAuth();

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      toast.error('Please create an account to buy coins');
      return;
    }
    
    window.open('https://ko-fi.com/niasser', '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Coin Shop</h1>
      </div>

      {/* Instructions */}
      <div className="bg-primary/10 p-4 rounded-lg mb-8">
        <h2 className="font-semibold text-lg mb-2 text-foreground">How to buy coins:</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2">
          {!isAuthenticated && (
            <li className="text-red-500 dark:text-red-400 font-medium">First, please create an account or sign in</li>
          )}
          <li>Click on your preferred coin package below</li>
          <li>You&apos;ll be redirected to Ko-fi for payment</li>
          <li><strong>Important:</strong> Include your username in the message when making the purchase</li>
          <li>Coins will be added to your account within 24 hours</li>
        </ol>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {coinPackages.map((pkg) => (
          <div 
            key={pkg.id}
            className="border border-border rounded-lg p-6 text-center hover:shadow-md transition-shadow bg-background"
          >
            <div className="flex justify-center mb-4">
              <Icon icon="pepicons-print:coins" className="text-amber-500 text-4xl" />
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-foreground">{pkg.coins} Coins</h3>
            <p className="text-2xl font-bold text-amber-500 dark:text-amber-400 mb-4">
              ${pkg.price.toFixed(2)}
            </p>

            <button
              onClick={handlePurchaseClick}
              className={`
                inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md font-medium
                ${isAuthenticated 
                  ? 'bg-[#29abe0] hover:bg-[#228db8] text-white' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}
                transition-colors
              `}
              disabled={!isAuthenticated}
            >
              <Icon icon="simple-icons:kofi" className="text-xl" />
              Buy on Ko-fi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 