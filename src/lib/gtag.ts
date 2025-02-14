// Google Analytics Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

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
    'analytics_storage': hasConsent ? 'granted' : 'denied',
    'ad_storage': hasConsent ? 'granted' : 'denied',
    'ad_user_data': hasConsent ? 'granted' : 'denied',
    'ad_personalization': hasConsent ? 'granted' : 'denied',
    'functionality_storage': hasConsent ? 'granted' : 'denied',
    'personalization_storage': hasConsent ? 'granted' : 'denied',
    'security_storage': 'granted', // Always granted as it's essential
  });

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true, // IP anonymization
    debug_mode: true // Enable debug mode temporarily
  });
};

// Update consent settings based on user choice
export const updateAnalyticsConsent = ({ analytics, advertising }: {
  analytics: boolean;
  advertising: boolean;
}) => {
  if (typeof window === 'undefined') return;

  console.log('[GA] Updating consent:', { analytics, advertising });

  const consentStatus = (granted: boolean) => granted ? 'granted' : 'denied';
  const adStorage = consentStatus(advertising);

  const consentParams = {
    'analytics_storage': consentStatus(analytics),
    'ad_storage': adStorage,
    'ad_user_data': adStorage,
    'ad_personalization': adStorage,
    'functionality_storage': consentStatus(analytics || advertising),
    'personalization_storage': consentStatus(analytics || advertising),
  };

  window.gtag('consent', 'update', consentParams);

  // Send page view after consent update
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
    anonymize_ip: true
  });

  // Debug output
  console.log('[GA] Consent updated:', consentParams);
};

// Track page views
export const pageView = (url: string) => {
  if (typeof window === 'undefined') return;
  
  console.log('[GA] Tracking pageview:', url);
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    send_page_view: true
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