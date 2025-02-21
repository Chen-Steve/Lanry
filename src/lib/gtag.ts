// Google Analytics Measurement ID
export const GA_MEASUREMENT_ID = 'G-PVZ6V89JEJ';

declare global {
  interface Window {
    gtag: (
      command: 'js' | 'config' | 'event',
      target: Date | string,
      params?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: unknown;
      }
    ) => void;
    dataLayer: unknown[];
  }
}

// Track page views
export const pageView = (url: string) => {
  if (typeof window === 'undefined') return;
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
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
}; 