'use client';

import { Icon } from '@iconify/react';
import { useIsPWA } from '@/hooks/useIsPWA';

export default function InstallAppPage() {
  const isPWA = useIsPWA();

  if (isPWA) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <Icon icon="ph:check-circle-fill" className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold">You&apos;re already using the app!</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enjoy the enhanced reading experience.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">How to install</h1>

      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* iOS Instructions */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">iPhone & iPad</h2>
          </div>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Open in Safari browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Tap Share <Icon icon="ph:export" className="w-4 h-4 inline mx-1" /></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Scroll down and select &quot;Add to Home Screen&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>Tap &quot;Add&quot; to confirm</span>
            </li>
          </ol>
        </div>

        {/* Android Instructions */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">Android</h2>
          </div>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Open in Chrome browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Look for &quot;Install app&quot; banner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Or tap menu <Icon icon="ph:dots-three-vertical-bold" className="w-4 h-4 inline mx-1" /> → &quot;Install app&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>Tap &quot;Install&quot; to confirm</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mt-4 text-sm border rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Icon icon="ph:info" className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Having trouble?</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Use Safari (iOS) or Chrome (Android)</li>
              <li>• Try refreshing the page</li>
              <li>• Disable ad blockers temporarily</li>
              <li>• Search how to install PWA</li>
              <li>• Ask in our Discord server</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 