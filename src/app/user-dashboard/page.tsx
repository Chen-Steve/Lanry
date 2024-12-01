'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load components with proper error handling
const ReadingHistorySection = lazy(() => 
  import('@/components/dashboard/ReadingHistory').catch(() => {
    console.error('Failed to load ReadingHistory component');
    return { default: () => <div>Failed to load reading history</div> };
  })
);

const Bookmarks = lazy(() => 
  import('@/components/dashboard/Bookmarks').catch(() => {
    console.error('Failed to load Bookmarks component');
    return { default: () => <div>Failed to load bookmarks</div> };
  })
);

const Settings = lazy(() => 
  import('@/components/dashboard/Settings').catch(() => {
    console.error('Failed to load Settings component');
    return { default: () => <div>Failed to load settings</div> };
  })
);

// Loading skeleton component
const TabSkeleton = () => (
  <div className="p-6">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

// Error Fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => {
  return (
    <div className="p-6 text-center">
      <p className="text-red-500 mb-4">Something went wrong:</p>
      <pre className="text-sm text-gray-500 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
};

type DashboardTab = 'reading' | 'bookmarks' | 'settings';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('reading');
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Fetch user profile data
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return profile;
    },
    retry: 1,
    staleTime: 30000,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth');
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Show loading state while checking auth
  if (isAuthChecking || isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (profileError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">Failed to load profile</p>
        <button
          onClick={() => router.push('/auth')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // If no profile is found, redirect to auth
  if (!profile && !isProfileLoading) {
    router.push('/auth');
    return null;
  }

  const renderTabContent = () => {
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          setActiveTab('reading');
        }}
      >
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'reading' && <ReadingHistorySection userId={profile?.id} />}
          {activeTab === 'bookmarks' && <Bookmarks userId={profile?.id} />}
          {activeTab === 'settings' && <Settings profile={profile} />}
        </Suspense>
      </ErrorBoundary>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mt-4 sm:mt-8 mb-6 sm:mb-10">
      <div className="bg-white border-b border-black rounded-md px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div>
              <h1 className="text-2xl sm:text-3xl text-black font-bold mb-1">
                {profile?.username || 'User'}
              </h1>
              <p className="text-sm text-gray-500">
                Joined {new Date(profile?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <a
            href="https://forms.gle/dYXhMkxfTi3odiLc8"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <Icon icon="mdi:plus-circle" width="20" />
            <span>Request a Novel</span>
          </a>
        </div>
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
        {renderTabContent()}
      </div>
    </div>
  );
} 