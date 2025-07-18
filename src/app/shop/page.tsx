'use client';

import { useAuth } from '@/hooks/useAuth';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState, useEffect } from 'react';
import Coins from './Coins';
import Membership from './Membership';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';

export default function ShopPage() {
  const { isAuthenticated, userId } = useAuth();
  const searchParams = useSearchParams();
  const [showMembership, setShowMembership] = useState(() => {
    return searchParams?.get('tab') === 'membership';
  });

  // Keep UI in sync if the query param changes client-side (e.g., via router.push)
  useEffect(() => {
    const isMembershipParam = searchParams?.get('tab') === 'membership';
    setShowMembership(isMembershipParam);
  }, [searchParams]);

  if (typeof window === 'undefined') {
    return null; // Prevent hydration issues
  }

  const baseOptions = {
    clientId: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
      : (process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)!,
    currency: "USD",
    components: "buttons,marks",
    vault: true,
  };
  
  const initialOptions = showMembership 
    ? {
        ...baseOptions,
        intent: "subscription",
        disableFunding: ["credit"],
        enableFunding: ["paypal"],
      }
    : {
        ...baseOptions,
        intent: "capture",
      };

  if (!isAuthenticated || !userId) {
    return (
      <div className="py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Create an account or sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-6">      
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-muted rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md ${!showMembership ? 'bg-background shadow-sm' : ''}`}
            onClick={() => setShowMembership(false)}
          >
            Coins
          </button>
          <button
            className={`px-4 py-2 rounded-md ${showMembership ? 'bg-background shadow-sm' : ''}`}
            onClick={() => setShowMembership(true)}
          >
            Membership
          </button>
        </div>
      </div>

      <PayPalScriptProvider options={initialOptions}>
        {showMembership ? <Membership /> : <Coins />}
      </PayPalScriptProvider>


      <div className="mt-8 text-center text-muted-foreground">
        <p className="text-sm">
          Questions or issues with your funds? Contact us on{' '}
          <a href="https://discord.gg/DXHRpV3sxF" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            Discord. We answer within 24 hours and offer a 100% money back guarantee.
          </a>
          {' '}or email us at{' '}
          <a href="mailto:c.niasser@gmail.com" className="text-primary hover:underline">
            c.niasser@gmail.com
          </a>
          {' '}for support.
        </p>
      </div>
      
      {/* Payment Info */}
      <div className="bg-muted/50 rounded-lg p-4 text-center mt-6">
        <Icon
          icon="ph:shield-check"
          className="h-6 w-6 text-green-600 mx-auto mb-2"
        />
        <h3 className="font-medium mb-2 text-sm">Secure Payment</h3>
        <p className="text-xs text-muted-foreground mb-3">
          All transactions are encrypted and processed securely through trusted
          payment providers.
        </p>
        <div className="flex justify-center gap-4 items-center mb-2">
          <div className="flex items-center gap-1">
            <Icon icon="logos:paypal" className="h-5 w-5" />
            <span className="text-xs font-medium text-foreground">PayPal</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="simple-icons:wise" className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-foreground">Wise</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          More payment options coming soon
        </p>
      </div>

      
    </div>
  );
} 