import { Icon } from '@iconify/react';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | Lanry',
  description: 'Learn about how Lanry uses cookies and how we protect your privacy.',
};

export default function CookiesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 mb-4">
          <Icon icon="material-symbols:cookie-outline" className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Cookie Policy</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {/* Quick Summary */}
        <div className="my-8 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
          <h2 className="mt-0 flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Icon icon="material-symbols:info-outline" className="w-5 h-5" />
            About Cookies
          </h2>
          <p className="mb-0 text-blue-700 dark:text-blue-400">
            Cookies are small text files stored on your device that help us improve your experience. You can manage your preferences using the cookie settings button.
          </p>
        </div>

        <div className="not-prose grid gap-4 my-6">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200/10 dark:border-gray-700/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Icon icon="material-symbols:check-circle-outline" className="w-5 h-5 text-green-500" />
              Essential cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 m-0">
              Required for basic website functionality and security. These cannot be disabled.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200/10 dark:border-gray-700/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Icon icon="material-symbols:analytics-outline" className="w-5 h-5 text-blue-500" />
              Analytics cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 m-0">
              Help us understand how visitors use our website to improve the experience.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200/10 dark:border-gray-700/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Icon icon="material-symbols:settings-outline" className="w-5 h-5 text-purple-500" />
              Preference cookies
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 m-0">
              Remember your settings like dark mode and language preferences.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t dark:border-gray-800">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium group"
          >
            <Icon icon="material-symbols:arrow-back" className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
} 