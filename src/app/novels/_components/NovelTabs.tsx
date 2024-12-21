'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ReactNode, useState } from 'react';

interface ContentTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface NovelTabsProps {
  tabs?: ContentTab[];
}

const navigationTabs = [
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

export default function NovelTabs({ tabs }: NovelTabsProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id);

  // If no tabs provided, render navigation tabs
  if (!tabs) {
    // Hide tabs on chapter pages
    if (pathname.includes('/chapters/')) {
      return null;
    }

    return (
      <div className="mb-4">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="hidden md:flex space-x-8" aria-label="Tabs">
            {navigationTabs.map((tab) => {
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

  // Render content tabs
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Tab Navigation */}
      <nav className="hidden md:flex space-x-8 border-b" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium -mb-[2px]
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
} 