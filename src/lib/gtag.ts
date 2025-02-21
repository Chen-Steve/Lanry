// Google Analytics Measurement ID
export const GA_MEASUREMENT_ID = 'G-PVZ6V89JEJ';

if (!GA_MEASUREMENT_ID) {
  console.warn('Google Analytics ID is not defined in environment variables');
}

declare global {
  interface Window {
    gtag: (
      command: 'js' | 'config' | 'consent' | 'event' | 'set' | 'get',
      target: Date | string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params?: any
    ) => void;
    [key: `ga-disable-${string}`]: boolean;
    dataLayer: unknown[];
  }
}

// Initialize Google Analytics with consent mode
export const initializeGoogleAnalytics = () => {
  if (typeof window === 'undefined') return;

  console.log('[GA] Initializing Google Analytics...');

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  script.onload = () => {
    console.log('[GA] GTM script loaded successfully');
  };
  script.onerror = (error) => {
    console.error('[GA] Error loading GTM script:', error);
  };
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: Parameters<Window['gtag']>) {
    window.dataLayer.push(args);
  };

  // Check stored consent
  const storedConsent = localStorage.getItem('cookie-consent');
  const hasConsent = storedConsent === 'accepted';

  console.log('[GA] Current consent status:', storedConsent);

  // Initialize with consent settings based on stored preference
  window.gtag('js', new Date());
  window.gtag('consent', 'default', {
    'analytics_storage': hasConsent ? 'granted' : 'denied'
  });

  window.gtag('config', GA_MEASUREMENT_ID);
};

// Update consent settings based on user choice
export const updateAnalyticsConsent = ({ analytics }: { analytics: boolean }) => {
  if (typeof window === 'undefined') return;

  console.log('[GA] Updating consent:', { analytics });

  const consentParams = {
    'analytics_storage': analytics ? 'granted' : 'denied'
  };

  window.gtag('consent', 'update', consentParams);
  window.gtag('config', GA_MEASUREMENT_ID);

  // Debug output
  console.log('[GA] Consent updated:', consentParams);
};

// Track page views
export const pageView = (url: string) => {
  if (typeof window === 'undefined') return;
  
  console.log('[GA] Tracking pageview:', url);
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url
  });
};

// Track specific events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (typeof window === 'undefined') return;

  console.log('[GA] Tracking event:', { action, category, label, value });

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
}; 