'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function CookieSettingsButton() {
  return (
    <Link
      href="/policies/cookies"
      className="fixed right-4 bottom-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200/10 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      aria-label="Cookie Settings"
    >
      <Icon icon="material-symbols:cookie-outline" className="w-5 h-5 text-blue-500" />
    </Link>
  );
} 