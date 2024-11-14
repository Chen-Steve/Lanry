'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import NovelUploadForm from '@/components/author-dashboard/NovelUploadForm';
import ChapterManagementForm from '@/components/author-dashboard/ChapterManagementForm';
import ChapterPurchaseHistory from '@/components/author-dashboard/ChapterPurchaseHistory';
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
      <div className="flex justify-center items-center h-screen">
        <Icon icon="mdi:loading" className="animate-spin text-3xl text-gray-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="p-4 lg:p-6">
          <h1 className="text-2xl font-bold mb-4">Author Dashboard</h1>
          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('novels')}
              className={`py-2 px-4 rounded-lg transition-colors ${
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
              className={`py-2 px-4 rounded-lg transition-colors ${
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
              className={`py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'purchases'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon icon="mdi:currency-usd" />
                Purchase History
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {activeTab === 'novels' && (
            <NovelUploadForm authorOnly={true} />
          )}
          {activeTab === 'chapters' && (
            <ChapterManagementForm authorOnly={true} />
          )}
          {activeTab === 'purchases' && (
            <ChapterPurchaseHistory />
          )}
        </div>
      </div>
    </div>
  );
} 