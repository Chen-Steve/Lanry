import { useEffect, useState } from "react";

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const checkPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true ||
      document.referrer.startsWith('android-app://');
    setIsPWA(checkPWA);
  }, []);

  return isPWA;
} 