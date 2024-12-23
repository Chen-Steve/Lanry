'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import NovelUploadForm from '@/app/author/_components/NovelUploadForm';
import ChapterManagementForm from '@/app/author/_components/ChapterManagementForm';
import ChapterPurchaseHistory from '@/app/author/_components/ChapterPurchaseHistory';
import NovelStatistics from '@/app/author/_components/NovelStatistics';
import TranslatorLinks from '@/app/author/_components/TranslatorLinks';
import { Icon } from '@iconify/react';

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState('novels');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

      if (!profile || !['AUTHOR', 'TRANSLATOR', 'ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
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
    <div className="flex min-h-screen relative" style={{ backgroundColor: '#F2EEE5' }}>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#E5E1D8] text-gray-600 hover:bg-[#E5E1D8]/80"
        aria-label="Toggle Sidebar"
      >
        <Icon icon={isSidebarOpen ? "mdi:close" : "mdi:menu"} className="text-2xl" />
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`w-64 bg-[#F2EEE5] border-r border-[#E5E1D8] fixed h-full z-40 transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 pt-16 lg:pt-6">
          <a href="https://lanry.vercel.app/" className="text-2xl font-bold mb-6 block text-center">
            Lanry
          </a>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('novels')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'novels'
                  ? 'bg-[#E5E1D8] text-indigo-700'
                  : 'text-gray-600 hover:bg-[#E5E1D8]/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:book-open-variant" />
                My Novels
              </span>
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'chapters'
                  ? 'bg-[#E5E1D8] text-indigo-700'
                  : 'text-gray-600 hover:bg-[#E5E1D8]/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:file-document-outline" />
                Manage Chapters
              </span>
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'purchases'
                  ? 'bg-[#E5E1D8] text-indigo-700'
                  : 'text-gray-600 hover:bg-[#E5E1D8]/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:currency-usd" />
                Earnings History
              </span>
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'statistics'
                  ? 'bg-[#E5E1D8] text-indigo-700'
                  : 'text-gray-600 hover:bg-[#E5E1D8]/50'
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
                  ? 'bg-[#E5E1D8] text-indigo-700'
                  : 'text-gray-600 hover:bg-[#E5E1D8]/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:link-variant" />
                Support Links
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1 p-8 pt-16 lg:pt-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'novels' && (
            <NovelUploadForm authorOnly={true} />
          )}
          {activeTab === 'chapters' && (
            <ChapterManagementForm authorOnly={true} />
          )}
          {activeTab === 'purchases' && (
            <ChapterPurchaseHistory />
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