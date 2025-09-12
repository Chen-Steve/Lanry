import { useEffect, useState } from "react";

export function useIsPWA() {
  // Perform the PWA detection immediately during the first render so that
  // components that rely on this value (e.g. AdSenseConditional) make the
  // correct decision before side-effects such as loading external scripts
  // are triggered.
  const detectPWA = () => {
    if (typeof window === 'undefined') return false;

    const nav = window.navigator as Navigator & { standalone?: boolean };
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  };

  const [isPWA, setIsPWA] = useState<boolean>(detectPWA);

  // Keep the state in sync if the display mode changes while the app is
  // running (rare, but possible on some platforms).
  useEffect(() => {
    try {
      const handler = () => setIsPWA(detectPWA());

      const mq = window.matchMedia('(display-mode: standalone)');
      mq.addEventListener?.('change', handler);

      return () => {
        mq.removeEventListener?.('change', handler);
      };
    } catch (error) {
      console.error('Error in useIsPWA effect:', error);
      return () => {};
    }
  }, []);

  return isPWA;
} 