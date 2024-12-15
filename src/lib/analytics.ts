import { track as vercelTrack } from '@vercel/analytics';

type EventProperties = Record<string, string | number | boolean>;

export const trackEvent = (eventName: string, properties?: EventProperties) => {
  try {
    vercelTrack(eventName, properties);
  } catch {
    // Silently fail in development or if tracking fails
    if (process.env.NODE_ENV === 'development') {
      // console.log(`[Analytics] ${eventName}`, properties);
    }
  }
};

// Predefined events with type safety
export const analyticsEvents = {
  NOVEL_VIEW: 'novel_view',
  CHAPTER_READ: 'chapter_read',
  BOOKMARK_ADD: 'bookmark_add',
  BOOKMARK_REMOVE: 'bookmark_remove',
  SEARCH_PERFORM: 'search_perform',
  AUTH_SIGNUP: 'auth_signup',
  AUTH_LOGIN: 'auth_login',
} as const;

// Type for the analytics events
export type AnalyticsEvent = typeof analyticsEvents[keyof typeof analyticsEvents]; 