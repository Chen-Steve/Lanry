'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface Settings {
  autoUnlock: boolean;
  paragraphComments: boolean;
  notifications: {
    chapters: boolean;
    commentReplies: boolean;
  };
}

export default function SettingsPage() {
  const [settings] = useState<Settings>({
    autoUnlock: false,
    paragraphComments: true,
    notifications: {
      chapters: true,
      commentReplies: true
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link 
          href="/user-dashboard"
          className="hover:opacity-80 transition-opacity"
        >
          <Icon icon="ph:arrow-left-bold" className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Additional Settings</h1>
      </div>

      <div className="space-y-8 relative">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
          <div className="bg-primary/10 rounded-full p-3">
            <Icon icon="ph:gear-six-fill" className="w-8 h-8 text-primary animate-spin-slow" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>

        </div>

        {/* General Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">General</h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden opacity-50">
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Auto Unlock Chapters</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically unlock next chapter when you have enough coins
                </p>
              </div>
              <div className={`
                w-11 h-6 rounded-full p-0.5 transition-colors duration-200
                ${settings.autoUnlock ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                <div className={`
                  w-5 h-5 rounded-full bg-white transition-transform duration-200
                  ${settings.autoUnlock ? 'translate-x-5' : 'translate-x-0'}
                `} />
              </div>
            </div>

            <div className="border-t border-border p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Paragraph Comments</h3>
                <p className="text-sm text-muted-foreground">
                  Show comment indicators next to paragraphs
                </p>
              </div>
              <div className={`
                w-11 h-6 rounded-full p-0.5 transition-colors duration-200
                ${settings.paragraphComments ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                <div className={`
                  w-5 h-5 rounded-full bg-white transition-transform duration-200
                  ${settings.paragraphComments ? 'translate-x-5' : 'translate-x-0'}
                `} />
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Notifications</h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden opacity-50">
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Chapter Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when new chapters are available
                </p>
              </div>
              <div className={`
                w-11 h-6 rounded-full p-0.5 transition-colors duration-200
                ${settings.notifications.chapters ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                <div className={`
                  w-5 h-5 rounded-full bg-white transition-transform duration-200
                  ${settings.notifications.chapters ? 'translate-x-5' : 'translate-x-0'}
                `} />
              </div>
            </div>

            <div className="border-t border-border p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Comment Reply Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone replies to your comments
                </p>
              </div>
              <div className={`
                w-11 h-6 rounded-full p-0.5 transition-colors duration-200
                ${settings.notifications.commentReplies ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                <div className={`
                  w-5 h-5 rounded-full bg-white transition-transform duration-200
                  ${settings.notifications.commentReplies ? 'translate-x-5' : 'translate-x-0'}
                `} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 