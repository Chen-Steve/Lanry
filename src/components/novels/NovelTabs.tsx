'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

const tabs = [
  {
    name: 'Browse',
    href: '/novels',
    icon: 'pepicons-print:book'
  },
  {
    name: 'Requests',
    href: '/novels/requests',
    icon: 'mdi:thumb-up-outline'
  }
];

export default function NovelTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = 
              tab.href === '/novels' 
                ? pathname === '/novels'
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon icon={tab.icon} className="text-xl" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 