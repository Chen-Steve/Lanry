'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types/database';
import { Theme } from '@/lib/ThemeContext';

interface AccountSectionProps {
  profile: UserProfile;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onWiseTag: () => void;
}

const themeIcons: Record<Theme, string> = {
  light: 'ph:sun-bold',
  dark: 'ph:moon-bold',
  blue: 'ph:drop-bold',
  green: 'ph:leaf-bold',
  gray: 'ph:circle-half-bold',
  orange: 'ph:sun-bold',
};

const themeNames: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  blue: 'Blue',
  green: 'Green',
  gray: 'Gray',
  orange: 'Orange',
};

export const AccountSection = ({
  profile,
  theme,
  setTheme,
  onEditProfile,
  onChangePassword,
  onWiseTag,
}: AccountSectionProps) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // Initialise from existing consent
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setAnalyticsEnabled(consent === 'accepted');
  }, []);

  const toggleAnalytics = () => {
    const newValue = !analyticsEnabled;
    setAnalyticsEnabled(newValue);

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: newValue ? 'granted' : 'denied',
      });
    }
    localStorage.setItem('cookie-consent', newValue ? 'accepted' : 'declined');
  };

  return (
    <div className="bg-container border-0 rounded-lg">
      <div className="px-4 pt-4">
        <h2 className="text-2xl font-bold">Account</h2>
      </div>

      <button
        onClick={onEditProfile}
        className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
      >
        <div className="flex items-center">
          <Icon icon="ph:pencil-simple-line" className="text-xl mr-4" />
          <span>Edit profile</span>
        </div>
        <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
      </button>

      <button
        onClick={onChangePassword}
        className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
      >
        <div className="flex items-center">
          <Icon icon="ph:lock-key" className="text-xl mr-4" />
          <span>Change Password</span>
        </div>
        <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
      </button>

      <button
        onClick={onWiseTag}
        className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
      >
        <div className="flex items-center">
          <Icon icon="simple-icons:wise" className="text-xl mr-4 text-green-600" />
          <div className="flex flex-col items-start">
            <span>Wise Tag</span>
            <span className="text-xs text-muted-foreground">
              {profile?.wise_tag ? `@${profile.wise_tag}` : 'Not connected'}
            </span>
          </div>
        </div>
        <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
      </button>

      {profile.role === 'TRANSLATOR' && (
        <Link
          href="/author/dashboard"
          className="w-full flex items-center justify-between p-4 hover:bg-[#faf7f2] dark:hover:bg-zinc-800 transition-colors rounded-lg"
        >
          <div className="flex items-center">
            <Icon icon="ph:pencil" className="text-xl mr-4" />
            <span>Author Dashboard</span>
          </div>
          <Icon icon="ph:caret-right" className="text-xl text-muted-foreground" />
        </Link>
      )}

      {/* Theme picker */}
      <div className="p-4 bg-container rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Theme</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(themeNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setTheme(key as Theme)}
                className={`flex items-center p-2.5 rounded-lg transition-colors ${
                  theme === key ? 'bg-card ring-2 ring-primary/20' : 'hover:bg-card'
                }`}
              >
                <Icon
                  icon={themeIcons[key as Theme]}
                  className={`text-lg mr-2 ${theme === key ? 'text-primary' : ''}`}
                />
                <span className="text-sm">{name}</span>
                {theme === key && <Icon icon="ph:check-bold" className="ml-auto text-primary text-sm" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics toggle */}
      <div className="p-4 bg-container rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Google Analytics</div>
            <p className="text-xs text-muted-foreground">Allow anonymous usage tracking</p>
          </div>
          <button
            type="button"
            onClick={toggleAnalytics}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              analyticsEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle Google Analytics"
            aria-checked={analyticsEnabled}
            role="switch"
          >
            <span
              className={`${analyticsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}; 