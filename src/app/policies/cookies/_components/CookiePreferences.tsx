'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { updateAnalyticsConsent } from '@/lib/gtag';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  advertising: boolean;
}

export default function CookiePreferences() {
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true,
    analytics: false,
    preferences: false,
    advertising: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      setSettings({
        essential: true,
        analytics: true,
        preferences: true,
        advertising: true,
      });
    } else if (consent === 'declined') {
      setSettings({
        essential: true,
        analytics: false,
        preferences: false,
        advertising: false,
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
    
    // Update consent based on new settings
    updateAnalyticsConsent({
      analytics: newSettings.analytics,
      advertising: newSettings.advertising
    });
    
    // Save overall consent status
    localStorage.setItem('cookie-consent', 
      newSettings.analytics || newSettings.preferences || newSettings.advertising 
        ? 'accepted' 
        : 'declined'
    );
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
            <p className="text-sm text-gray-600 dark:text-gray-300">Help us improve our website and measure performance</p>
          </div>
          <button
            type="button"
            title="Toggle analytics cookies"
            onClick={() => handleToggle('analytics')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.analytics ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle analytics cookies"
            aria-checked="false"
            role="switch"
          >
            <span className={`${settings.analytics ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Advertising Cookies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Enable personalized ads and audience measurement</p>
          </div>
          <button
            type="button"
            title="Toggle advertising cookies"
            onClick={() => handleToggle('advertising')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.advertising ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle advertising cookies"
            aria-checked="false"
            role="switch"
          >
            <span className={`${settings.advertising ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
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