// Google Analytics Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

if (!GA_MEASUREMENT_ID) {
  console.warn('Google Analytics ID is not defined in environment variables');
}

declare global {
  interface Window {
    gtag: (
      command: 'js' | 'config' | 'consent' | 'event' | 'set',
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
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: Parameters<Window['gtag']>) {
    window.dataLayer.push(args);
  };

  // Initialize with default consent settings (all false)
  window.gtag('js', new Date());
  window.gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted' // Always granted as it's essential
  });

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

// Update consent settings based on user choice
export const updateAnalyticsConsent = ({ analytics, advertising }: {
  analytics: boolean;
  advertising: boolean;
}) => {
  if (typeof window === 'undefined') return;

  const consentStatus = (granted: boolean) => granted ? 'granted' : 'denied';

  const consentParams = {
    'analytics_storage': consentStatus(analytics),
    'ad_storage': consentStatus(advertising),
    'ad_user_data': consentStatus(advertising),
    'ad_personalization': consentStatus(advertising),
    'functionality_storage': consentStatus(analytics || advertising),
    'personalization_storage': consentStatus(analytics || advertising)
  };

  window.gtag('consent', 'update', consentParams);

  // If analytics is granted, send a page view event
  if (analytics) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
      send_page_view: true
    });
  }
};

// Track page views
export const pageView = (url: string) => {
  if (typeof window === 'undefined') return;
  
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

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
}; 