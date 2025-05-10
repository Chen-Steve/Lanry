'use client';

import { useEffect, useState } from 'react';
import { useAdFreeStatus } from '@/hooks/useAdFreeStatus';
import Script from 'next/script';

/**
 * AdFreeScript component is responsible for checking if a user has ad-free status
 * and disabling Google ads if they do by setting appropriate consent parameters
 */
export default function AdFreeScript() {
  const { isAdFree, isLoading } = useAdFreeStatus();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Only run after hook is done loading and component has mounted
    if (isLoading || !scriptLoaded) return;
    
    try {
      if (isAdFree) {
        console.log('Ad-free experience enabled');
        
        // Update consent settings if gtag exists
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
          });
        }

        // Add CSS to hide ads
        const style = document.createElement('style');
        style.innerHTML = `
          ins.adsbygoogle { display: none !important; }
          iframe[src*="googleads"], iframe[src*="doubleclick"] { display: none !important; }
          div[id*="gpt"], div[id*="google_ads"] { display: none !important; }
        `;
        document.head.appendChild(style);
        
        // Add script to disable ad loading
        const script = document.createElement('script');
        script.textContent = `
          (function() {
            if (typeof window !== 'undefined') {
              window.adsbygoogle = window.adsbygoogle || [];
              if (window.adsbygoogle.loaded !== true) {
                window.adsbygoogle.loaded = true;
                window.adsbygoogle.push = function() {};
              }
              console.log('AdSense ads disabled');
            }
          })();
        `;
        document.head.appendChild(script);
      } else if (typeof window.gtag === 'function') {
        // For regular users, enable ads
        window.gtag('consent', 'update', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted',
        });
        console.log('Standard ad experience enabled');
      }
    } catch (error) {
      console.error('Error configuring ad experience:', error);
    }
  }, [isAdFree, isLoading, scriptLoaded]);

  return (
    <Script 
      id="ad-free-initialization"
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
    >
      {`
        // Initialize ad control functionality
        console.log('Ad control script loaded');
      `}
    </Script>
  );
} 