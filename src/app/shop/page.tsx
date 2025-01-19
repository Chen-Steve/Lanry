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
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Coin Shop</h1>
      </div>

      {/* Instructions and Discord Notice */}
      <div className="bg-primary/10 p-4 rounded-lg mb-6 space-y-4">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:information" className="text-xl text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {!isAuthenticated && <span className="text-red-500 dark:text-red-400 block font-medium mb-1">First, please create an account or sign in</span>}
              1. Click your preferred package below<br />
              2. Include your username in the Ko-fi message<br />
              3. Coins will be added within 12 hours
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Icon icon="mdi:discord" className="text-xl text-[#5865F2] mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Get <span className="font-medium text-[#5865F2]">Supporter role</span> on our Discord server with any purchase!
          </p>
        </div>
      </div>

      {/* Packages Grid */}
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

            <button
              onClick={handlePurchaseClick}
              className={`
                inline-flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-md text-sm font-medium
                ${isAuthenticated 
                  ? 'bg-[#29abe0] hover:bg-[#228db8] text-white' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}
                transition-colors
              `}
              disabled={!isAuthenticated}
            >
              <Icon icon="simple-icons:kofi" className="text-lg" />
              Buy on Ko-fi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 