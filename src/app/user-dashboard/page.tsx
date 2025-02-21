'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import StatusSection from '@/app/user-dashboard/_components/StatusSection';
import Image from 'next/image';
import Link from 'next/link';

const ReadingHistorySection = lazy(() => 
  import('@/app/user-dashboard/_components/ReadingHistory').catch(() => {
    console.error('Failed to load ReadingHistory component');
    return { default: () => <div>Failed to load reading history</div> };
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
      <div className="h-5 sm:h-6 bg-muted rounded-md w-2/3"></div>
      <div className="h-4 bg-muted rounded-md w-1/2"></div>
      <div className="h-4 bg-muted rounded-md w-1/3"></div>
    </div>
  </div>
);

// Updated error fallback with minimal design
const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => (
  <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
    <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading content</p>
    <p className="text-sm text-red-500 dark:text-red-300 mb-3">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="text-sm px-3 py-1.5 bg-background border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-accent transition-colors"
    >
      Retry
    </button>
  </div>
);

type DashboardTab = 'reading' | 'settings';

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
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-muted-foreground hover:bg-accent'
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

      // Fetch profile with reading history counts
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          coins,
          created_at,
          current_streak,
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
        stories_read: profile.reading_history[0]?.count || 0
      };
    },
    retry: 1,
    staleTime: 30000,
  });

  // Update isOwnProfile when profile data changes
  useEffect(() => {
    const checkOwnProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnProfile(user?.id === (profileId || user?.id));
    };
    
    checkOwnProfile();
  }, [profileId, profile]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        // Only proceed with profile check if we're viewing own profile
        if (!profileId) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (profileError || !profile) {
            console.error('Profile check error:', profileError);
            router.push('/auth');
            return;
          }
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
      if (event === 'SIGNED_OUT' || !session) {
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
        <Icon icon="eos-icons:loading" className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (profileError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center bg-red-100 dark:bg-red-900/20 rounded-lg p-4 sm:p-6">
          <p className="text-red-600 dark:text-red-400 mb-3">Unable to load profile</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-accent transition-colors"
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
        <div className="text-center bg-red-100 dark:bg-red-900/20 rounded-lg p-4 sm:p-6">
          <p className="text-red-600 dark:text-red-400 mb-3">Profile not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-accent transition-colors"
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
        <div className="w-16 h-16 rounded-full overflow-hidden bg-primary">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username || 'User avatar'}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show initials fallback
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = profile?.username?.[0]?.toUpperCase() || 'U';
                  parent.className = "w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-semibold";
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-foreground text-xl font-semibold">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-foreground">
              {profile?.username || 'User'}
            </h1>
            {isOwnProfile && (profile?.role === 'AUTHOR' || profile?.role === 'TRANSLATOR') && (
              <Link
                href="/author/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Icon icon="mdi:pencil" className="text-lg" />
                <span>Author</span>
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            {isOwnProfile && (
              <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">
                <Icon icon="ph:coin-fill" className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">{profile?.coins || 0}</span>
              </div>
            )}
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
      />

      {/* Navigation Tabs */}
      <nav className="border-b border-border p-1">
        <div className="flex gap-1">
          <TabButton 
            active={activeTab === 'reading'} 
            onClick={() => setActiveTab('reading')}
          >
            Recent Reads
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
            {isOwnProfile && activeTab === 'settings' && <Settings profile={profile} />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
} 