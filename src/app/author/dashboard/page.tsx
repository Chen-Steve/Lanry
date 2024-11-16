'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import NovelUploadForm from '@/components/author-dashboard/NovelUploadForm';
import ChapterManagementForm from '@/components/author-dashboard/ChapterManagementForm';
import ChapterPurchaseHistory from '@/components/author-dashboard/ChapterPurchaseHistory';
import NovelStatistics from '@/components/author-dashboard/NovelStatistics';
import { Icon } from '@iconify/react';

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState('novels');
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

      if (!profile || !['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6">
          <a href="https://lanry.vercel.app/" className="text-2xl font-bold mb-6 block text-center">
            Lanry
          </a>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('novels')}
              className={`w-full py-2 px-4 rounded-lg transition-colors text-left ${
                activeTab === 'novels'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
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
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
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
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
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
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:chart-bar" />
                Statistics
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
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
      </div>
    </div>
  );
} 