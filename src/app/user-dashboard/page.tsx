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

// Update TabSkeleton for mobile-first design
const TabSkeleton = () => (
  <div className="p-3 sm:p-4">
    <div className="animate-pulse space-y-2 sm:space-y-3">
      <div className="h-5 sm:h-6 bg-gray-100 rounded-md w-2/3"></div>
      <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
      <div className="h-4 bg-gray-100 rounded-md w-1/3"></div>
    </div>
  </div>
);

// Updated error fallback with minimal design
const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => (
  <div className="p-4 bg-red-50 rounded-lg">
    <p className="text-red-600 font-medium mb-2">Error loading content</p>
    <p className="text-sm text-red-500 mb-3">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="text-sm px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
    >
      Retry
    </button>
  </div>
);

type DashboardTab = 'reading' | 'bookmarks' | 'settings';

// Update TabButton for better mobile experience
const TabButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`
      min-w-[80px] px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded-md transition-colors
      ${active 
        ? 'bg-blue-50 text-blue-600 font-medium' 
        : 'text-gray-600 hover:bg-gray-50'
      }
    `}
  >
    {children}
  </button>
);

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
      <div className="flex justify-center items-center min-h-[50vh]">
        <Icon icon="eos-icons:loading" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (profileError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center bg-red-50 rounded-lg p-4 sm:p-6">
          <p className="text-red-600 mb-3">Unable to load your profile</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If no profile is found, redirect to auth
  if (!profile && !isProfileLoading) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Profile Header */}
      <div className="bg-white p-4 sm:p-6 border-b">
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {profile?.username || 'User'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Member since {new Date(profile?.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation and Content */}
      <div className="bg-white">
        <div className="border-b">
          <nav className="p-2 sm:p-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-min">
              <TabButton 
                active={activeTab === 'reading'} 
                onClick={() => setActiveTab('reading')}
              >
                Reading
              </TabButton>
              <TabButton 
                active={activeTab === 'bookmarks'} 
                onClick={() => setActiveTab('bookmarks')}
              >
                Bookmarks
              </TabButton>
              <TabButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </TabButton>
            </div>
          </nav>
        </div>

        <div className="p-3 sm:p-4">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => setActiveTab('reading')}
          >
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === 'reading' && <ReadingHistorySection userId={profile?.id} />}
              {activeTab === 'bookmarks' && <Bookmarks userId={profile?.id} />}
              {activeTab === 'settings' && <Settings profile={profile} />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
} 