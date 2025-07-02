'use client';

import { useEffect, useState } from 'react';

export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWAMode = () => {
      // Check if running in standalone mode (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // iOS Safari specific check
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = 'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone;
      
      // Android/Desktop PWA check
      const isAndroidPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      setIsPWA(isStandalone || (isIOS && isInStandaloneMode) || isAndroidPWA);
    };

    // Check immediately
    checkPWAMode();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAMode);

    return () => {
      mediaQuery.removeEventListener('change', checkPWAMode);
    };
  }, []);

  return isPWA;
} 