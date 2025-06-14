'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, Theme } from '@/lib/ThemeContext';
import supabase from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import Image from 'next/image';

// Dynamic imports with loading fallbacks
const NovelManagement = dynamic(() => import('@/app/author/_components/NovelManagement'), {
  loading: () => <LoadingSpinner />
});
const ChapterPurchaseHistory = dynamic(() => import('@/app/author/_components/ChapterPurchaseHistory'), {
  loading: () => <LoadingSpinner />
});
const NovelComments = dynamic(() => import('@/app/author/_components/NovelComments'), {
  loading: () => <LoadingSpinner />
});
const NovelStatistics = dynamic(() => import('@/app/author/_components/NovelStatistics'), {
  loading: () => <LoadingSpinner />
});
const TranslatorLinks = dynamic(() => import('@/app/author/_components/TranslatorLinks'), {
  loading: () => <LoadingSpinner />
});

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
  </div>
);

const themeIcons: Record<Theme, string> = {
  'light': 'ph:sun-bold',
  'dark': 'ph:moon-bold',
  'blue': 'ph:drop-bold',
  'green': 'ph:leaf-bold',
  'gray': 'ph:circle-half-bold',
  'orange': 'ph:sun-bold'
};

const themeNames: Record<Theme, string> = {
  'light': 'Light',
  'dark': 'Dark',
  'blue': 'Blue',
  'green': 'Green',
  'gray': 'Gray',
  'orange': 'Orange'
};

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState('manage-novels');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || !['AUTHOR', 'TRANSLATOR'].includes(profile.role)) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen relative bg-background">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground"
        aria-label="Toggle Sidebar"
      >
        <Icon icon={isSidebarOpen ? "mdi:close" : "mdi:menu"} className="text-2xl" />
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-background border-r border-border fixed left-0 h-full z-40 transition-all duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4">
            <a href="https://lanry.space/" className="mb-6 block text-center" aria-label="Lanry Home">
              <Image
                src="/lanry.jpg"
                alt="Lanry Logo"
                width={isSidebarCollapsed ? 40 : 60}
                height={isSidebarCollapsed ? 40 : 60}
                className="mx-auto rounded-lg object-cover"
                priority
              />
            </a>
            {/* Collapse / Expand button (desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex items-center gap-2 w-full py-2 px-4 mb-4 rounded-lg transition-colors text-left text-muted-foreground hover:bg-accent/50"
            >
              <Icon icon={isSidebarCollapsed ? 'mdi:menu' : 'mdi:menu-open'} className="w-5 h-5" />
              {!isSidebarCollapsed && <span>Collapse</span>}
            </button>
            <button
              onClick={() => setActiveTab('manage-novels')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'manage-novels'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:bookshelf" />
                {!isSidebarCollapsed && 'Manage Novels'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'purchases'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:currency-usd" />
                {!isSidebarCollapsed && 'Earnings History'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'comments'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:comment-text-multiple" />
                {!isSidebarCollapsed && 'Comments'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'statistics'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:chart-bar" />
                {!isSidebarCollapsed && 'Statistics'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'links'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:link-variant" />
                {!isSidebarCollapsed && 'Support Links'}
              </span>
            </button>
            
            <div className="mt-auto pt-4 border-t border-border">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Theme</div>
                <div className="relative">
                  <button
                    onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                    className="w-full py-2 px-4 rounded-lg transition-colors text-left bg-accent/50 hover:bg-accent text-foreground"
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon icon={themeIcons[theme]} className="w-5 h-5" />
                        {!isSidebarCollapsed && themeNames[theme]}
                      </span>
                      <Icon 
                        icon={isThemeDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
                        className="w-5 h-5" 
                      />
                    </span>
                  </button>
                  
                  {isThemeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                      {Object.entries(themeNames).map(([key, name]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setTheme(key as Theme);
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full py-2 px-4 transition-colors text-left hover:bg-accent/50 flex items-center gap-2 ${
                            theme === key
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <Icon icon={themeIcons[key as Theme]} className="w-5 h-5" />
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex-1 min-w-0`}>
        <div className="pt-10 h-full">
            {activeTab === 'manage-novels' && (
              <NovelManagement />
            )}
            {activeTab === 'purchases' && (
              <ChapterPurchaseHistory />
            )}
            {activeTab === 'comments' && (
              <NovelComments />
            )}
            {activeTab === 'statistics' && (
              <NovelStatistics />
            )}
            {activeTab === 'links' && (
              <TranslatorLinks />
            )}
        </div>
      </div>
    </div>
  );
} 