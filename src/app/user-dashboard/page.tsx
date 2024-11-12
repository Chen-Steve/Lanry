'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { Icon } from '@iconify/react';

// Lazy load components
const ReadingHistorySection = lazy(() => import('@/components/dashboard/ReadingHistory'));
const Bookmarks = lazy(() => import('@/components/dashboard/Bookmarks'));
const Settings = lazy(() => import('@/components/dashboard/Settings'));

// Loading skeleton component
const TabSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
);

type DashboardTab = 'reading' | 'bookmarks' | 'settings';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('reading');
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">My Dashboard</h1>
        <button
          onClick={handleSignOut}
          className="text-red-500 hover:text-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Dashboard Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reading')}
            className={`py-4 px-1 border-b-2 font-medium flex items-center gap-2 ${
              activeTab === 'reading'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            title="Reading History"
          >
            <Icon icon="mdi:book-open-page-variant" width="20" />
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-4 px-1 border-b-2 font-medium flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            title="Bookmarks"
          >
            <Icon icon="mdi:bookmark" width="20" />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            title="Settings"
          >
            <Icon icon="mdi:cog" width="20" />
          </button>
        </nav>
      </div>

      {/* Dashboard Content */}
      <div className="bg-white rounded-lg shadow">
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'reading' && <ReadingHistorySection />}
          {activeTab === 'bookmarks' && <Bookmarks />}
          {activeTab === 'settings' && <Settings />}
        </Suspense>
      </div>
    </div>
  );
} 