'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { initializeGoogleAnalytics, updateAnalyticsConsent } from '@/lib/gtag';

declare global {
  interface Window {
    [key: `ga-disable-${string}`]: boolean;
  }
}

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Initialize Google Analytics with default (denied) consent
    initializeGoogleAnalytics();

    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    } else if (consent === 'accepted') {
      // If user has already accepted, update consent
      updateAnalyticsConsent(true);
    }

    // Listen for the custom event to show cookie consent
    const handleShowConsent = () => {
      setShowConsent(true);
    };

    window.addEventListener('show-cookie-consent', handleShowConsent);
    return () => {
      window.removeEventListener('show-cookie-consent', handleShowConsent);
    };
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    updateAnalyticsConsent(true);
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    updateAnalyticsConsent(false);
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200/10 dark:border-gray-700/50 z-50 animate-fade-up">
      <div className="flex items-start gap-3 mb-4">
        <Icon icon="material-symbols:cookie-outline" className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          We use cookies to enhance your experience and analyze site traffic.
          <Link href="/policies/cookies" className="text-blue-500 hover:text-blue-600 ml-1 inline-flex items-center gap-1">
            Learn more
            <Icon icon="material-symbols:arrow-outward" className="w-3 h-3" />
          </Link>
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={declineCookies}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={acceptCookies}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-1"
        >
          Accept
          <Icon icon="material-symbols:check-small" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 