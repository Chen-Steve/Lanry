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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        aria-label="Toggle Sidebar"
      >
        <Icon icon={isSidebarOpen ? "ph:sidebar-simple" : "ph:sidebar-simple"} className="text-xl text-gray-600 dark:text-gray-300" />
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <nav className={`${isSidebarCollapsed ? 'w-14' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 h-full z-40 transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className={`flex items-center p-4 border-b border-gray-200 dark:border-gray-700 h-16 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {/* Logo - hidden when collapsed */}
          {!isSidebarCollapsed && (
            <a href="https://lanry.space/" className="flex items-center gap-3 flex-shrink-0" aria-label="Lanry Home">
              <Image
                src="/lanry.jpg"
                alt="Lanry Logo"
                width={32}
                height={32}
                className="rounded-lg object-cover"
                priority
              />
            </a>
          )}
          
          {/* Collapse/Expand button */}
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon icon={isSidebarCollapsed ? "ph:sidebar-simple" : "ph:sidebar-simple"} className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('manage-novels')}
              className={`mx-2 flex items-center justify-start rounded-md text-sm font-medium transition-all duration-300 py-2 px-2.5 ${
                activeTab === 'manage-novels'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? 'Manage Novels' : undefined}
            >
              <Icon icon="mdi:bookshelf" className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-3'}`}>
                Manage Novels
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('purchases')}
              className={`mx-2 flex items-center justify-start rounded-md text-sm font-medium transition-all duration-300 py-2 px-2.5 ${
                activeTab === 'purchases'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? 'Earnings History' : undefined}
            >
              <Icon icon="mdi:currency-usd" className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-3'}`}>
                Earnings History
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('comments')}
              className={`mx-2 flex items-center justify-start rounded-md text-sm font-medium transition-all duration-300 py-2 px-2.5 ${
                activeTab === 'comments'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? 'Comments' : undefined}
            >
              <Icon icon="mdi:comment-text-multiple" className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-3'}`}>
                Comments
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('statistics')}
              className={`mx-2 flex items-center justify-start rounded-md text-sm font-medium transition-all duration-300 py-2 px-2.5 ${
                activeTab === 'statistics'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? 'Statistics' : undefined}
            >
              <Icon icon="mdi:chart-bar" className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-3'}`}>
                Statistics
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('links')}
              className={`mx-2 flex items-center justify-start rounded-md text-sm font-medium transition-all duration-300 py-2 px-2.5 ${
                activeTab === 'links'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isSidebarCollapsed ? 'Support Links' : undefined}
            >
              <Icon icon="mdi:link-variant" className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-3'}`}>
                Support Links
              </span>
            </button>
          </div>
        </div>
        
        {/* Theme Selector - Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className={`mx-2 flex items-center justify-start rounded-md text-sm font-medium transition-all duration-300 py-2 px-2.5 text-gray-600 dark:text-gray-300`}
              title={isSidebarCollapsed ? 'Theme Settings' : undefined}
            >
              <Icon icon={themeIcons[theme]} className="w-5 h-5 flex-shrink-0 -ml-3 mr-3" />
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Theme
              </span>
            </button>
            
            {isThemeDropdownOpen && (
              <div className={`absolute ${isSidebarCollapsed ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2'} ${isSidebarCollapsed ? 'w-48' : 'left-0 right-0'} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50`}>
                {Object.entries(themeNames).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key as Theme);
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                      theme === key
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon icon={themeIcons[key as Theme]} className="w-4 h-4 flex-shrink-0" />
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`${isSidebarCollapsed ? 'lg:ml-14' : 'lg:ml-64'} flex-1 min-w-0 transition-all duration-300 ease-in-out`}>
        <div className="h-full bg-white dark:bg-gray-900 lg:rounded-tl-xl lg:border-l lg:border-gray-200 lg:dark:border-gray-700">
          <div className="p-6 lg:p-8">
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
      </main>
    </div>
  );
} 