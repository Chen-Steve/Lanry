'use client';

import { useAuth } from '@/hooks/useAuth';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from 'react';
import Coins from './Coins';
import Membership from './Membership';

export default function ShopPage() {
  const { isAuthenticated, userId } = useAuth();
  const [showMembership, setShowMembership] = useState(false);

  if (typeof window === 'undefined') {
    return null; // Prevent hydration issues
  }

  const baseOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
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
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Please create an account or sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Shop</h1>
      
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
    </div>
  );
} 