'use client';

import { Icon } from '@iconify/react';
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
    'data-uid-auto': 'uid_' + Math.random().toString(36).substring(2),
  };
  
  const initialOptions = showMembership 
    ? {
        ...baseOptions,
        vault: true,
        intent: "subscription",
        components: "buttons,marks",
        disableFunding: ["credit"],
        enableFunding: ["paypal"],
      }
    : {
        ...baseOptions,
        intent: "capture",
        vault: false,
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-muted p-1 rounded-lg mb-6">
          <button
            onClick={() => setShowMembership(false)}
            className={`px-4 py-2 rounded-md transition-colors ${!showMembership ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          >
            <div className="flex items-center gap-2">
              <Icon icon="pepicons-print:coins" className="text-amber-500" />
              <span>Coins</span>
            </div>
          </button>
          <button
            onClick={() => setShowMembership(true)}
            className={`px-4 py-2 rounded-md transition-colors ${showMembership ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          >
            <div className="flex items-center gap-2">
              <Icon icon="carbon:user-membership" className="text-primary" />
              <span>Membership</span>
            </div>
          </button>
        </div>
      </div>

      <PayPalScriptProvider options={initialOptions} deferLoading={false}>
        {!showMembership ? <Coins /> : <Membership />}
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