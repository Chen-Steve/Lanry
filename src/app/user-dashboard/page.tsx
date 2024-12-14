'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import StatusSection from '@/app/user-dashboard/_components/StatusSection';
import { calculateLevel } from '@/lib/utils';

const ReadingHistorySection = lazy(() => 
  import('@/app/user-dashboard/_components/ReadingHistory').catch(() => {
    console.error('Failed to load ReadingHistory component');
    return { default: () => <div>Failed to load reading history</div> };
  })
);

const Bookmarks = lazy(() => 
  import('@/app/user-dashboard/_components/Bookmarks').catch(() => {
    console.error('Failed to load Bookmarks component');
    return { default: () => <div>Failed to load bookmarks</div> };
  })
);

const Settings = lazy(() => 
  import('@/app/user-dashboard/_components/Settings').catch(() => {
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
      px-3 py-1.5 text-sm rounded-md transition-colors
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
  const searchParams = useSearchParams();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const profileId = searchParams.get('id');

  // Fetch user profile data
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no profileId is provided, show the current user's profile
      const targetId = profileId || user?.id;
      if (!targetId) return null;

      // Set whether this is the user's own profile
      setIsOwnProfile(user?.id === targetId);

      // Fetch profile with bookmarks and reading history counts
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          coins,
          created_at,
          current_streak,
          bookmarks!inner(count),
          reading_history!inner(count)
        `)
        .eq('id', targetId)
        .single();

      if (profileError) throw profileError;

      // Fetch reading time
      const { data: readingTimeData, error: readingTimeError } = await supabase
        .from('reading_time')
        .select('total_minutes')
        .eq('profile_id', targetId)
        .single();

      if (readingTimeError && readingTimeError.code !== 'PGRST116') {
        throw readingTimeError;
      }

      return {
        ...profile,
        reading_time: readingTimeData || { total_minutes: 0 },
        bookmarks_count: profile.bookmarks[0]?.count || 0,
        stories_read: profile.reading_history[0]?.count || 0
      };
    },
    retry: 1,
    staleTime: 30000,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check auth if viewing own profile (no profileId in URL)
        if (!profileId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.push('/auth');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (!profileId) {
          router.push('/auth');
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!profileId && event === 'SIGNED_OUT') {
        router.push('/auth');
      }
      setIsAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, profileId]);

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
          <p className="text-red-600 mb-3">Unable to load profile</p>
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

  // If no profile is found, show error
  if (!profile && !isProfileLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center bg-red-50 rounded-lg p-4 sm:p-6">
          <p className="text-red-600 mb-3">Profile not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
          {profile?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-grow">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {profile?.username || 'User'}
          </h1>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md">
              <Icon icon="ph:coin-fill" className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700 font-medium">{profile?.coins || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md">
              <Icon icon="heroicons:star" className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">Level {calculateLevel(profile?.reading_time?.total_minutes || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <StatusSection 
        readingStreak={profile?.current_streak || 0}
        totalReadingTime={profile?.reading_time?.total_minutes || 0}
        joinedDate={new Date(profile?.created_at).toLocaleDateString('en-US', { 
          month: 'long',
          year: 'numeric'
        })}
        storiesRead={profile?.stories_read || 0}
        bookmarkCount={profile?.bookmarks_count || 0}
      />

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-100 p-1">
        <div className="flex gap-1">
          <TabButton 
            active={activeTab === 'reading'} 
            onClick={() => setActiveTab('reading')}
          >
            Recent Reads
          </TabButton>
          <TabButton 
            active={activeTab === 'bookmarks'} 
            onClick={() => setActiveTab('bookmarks')}
          >
            Bookmarks
          </TabButton>
          {isOwnProfile && (
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </TabButton>
          )}
        </div>
      </nav>

      <div className={activeTab === 'settings' ? 'p-4' : ''}>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => setActiveTab('reading')}
        >
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === 'reading' && <ReadingHistorySection userId={profile?.id} />}
            {activeTab === 'bookmarks' && <Bookmarks userId={profile?.id} isOwnProfile={isOwnProfile} />}
            {isOwnProfile && activeTab === 'settings' && <Settings profile={profile} />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
} 