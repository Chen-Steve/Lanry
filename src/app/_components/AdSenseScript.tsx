'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdSenseScript() {
  const [showAds, setShowAds] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdEligibility = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: transactions, error } = await supabase
          .from('coin_transactions')
          .select('amount')
          .eq('profileId', user.id);

        if (error) {
          console.error('Error fetching coin transactions:', error);
          return;
        }

        if (transactions && transactions.some(t => t.amount >= 50)) {
          setShowAds(false);
        }
      }
    };

    checkAdEligibility();
  }, [supabase]);

  if (!showAds) {
    return null;
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7984663674761616"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
} 