'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { updateAnalyticsConsent } from '@/lib/gtag';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

export default function CookiePreferences() {
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true,
    analytics: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      setSettings({
        essential: true,
        analytics: true,
        preferences: true,
      });
    } else if (consent === 'declined') {
      setSettings({
        essential: true,
        analytics: false,
        preferences: false,
      });
    }
  }, []);

  const handleToggle = (type: keyof CookieSettings) => {
    if (type === 'essential') return;
    
    const newSettings = {
      ...settings,
      [type]: !settings[type],
    };
    
    setSettings(newSettings);
    
    if (newSettings.analytics && newSettings.preferences) {
      localStorage.setItem('cookie-consent', 'accepted');
      updateAnalyticsConsent(true);
    } else {
      localStorage.setItem('cookie-consent', 'declined');
      updateAnalyticsConsent(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200/10 dark:border-gray-700/50 p-6">
      <h2 className="text-lg font-semibold mb-4">Cookie Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Essential Cookies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Required for the website to function properly</p>
          </div>
          <button
            type="button"
            title="Toggle essential cookies"
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 cursor-not-allowed"
            disabled
            aria-label="Toggle essential cookies"
            aria-checked="true"
            role="switch"
          >
            <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Analytics Cookies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Help us improve our website</p>
          </div>
          <button
            type="button"
            title="Toggle analytics cookies"
            onClick={() => handleToggle('analytics')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.analytics ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle analytics cookies"
          >
            <span className={`${settings.analytics ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Preference Cookies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Remember your settings and preferences</p>
          </div>
          <button
            type="button"
            title="Toggle preference cookies"
            onClick={() => handleToggle('preferences')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.preferences ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle preference cookies"
          >
            <span className={`${settings.preferences ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Icon icon="material-symbols:info-outline" className="w-4 h-4" />
        <p>Changes are saved automatically</p>
      </div>
    </div>
  );
} 