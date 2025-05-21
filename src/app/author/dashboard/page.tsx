'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, Theme } from '@/lib/ThemeContext';
import supabase from '@/lib/supabaseClient';
import ChapterPurchaseHistory from '@/app/author/_components/ChapterPurchaseHistory';
import NovelStatistics from '@/app/author/_components/NovelStatistics';
import TranslatorLinks from '@/app/author/_components/TranslatorLinks';
import NovelManagement from '@/app/author/_components/NovelManagement';
import NovelComments from '@/app/author/_components/NovelComments';
import { Icon } from '@iconify/react';

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
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

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
      <div className={`w-64 bg-background border-r border-border fixed left-0 h-full z-40 transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4">
            <a href="https://lanry.space/" className="text-2xl font-bold mb-6 block text-center text-foreground">
              Lanry
            </a>
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
                Manage Novels
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
                Earnings History
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
                Comments
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
                Statistics
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
                Support Links
              </span>
            </button>
            
            <div className="mt-auto pt-4 border-t border-border">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Theme</div>
                <div className="space-y-1">
                  {Object.entries(themeNames).map(([key, name]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key as Theme)}
                      className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                        theme === key
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon icon={themeIcons[key as Theme]} className="w-5 h-5" />
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1 min-w-0">
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