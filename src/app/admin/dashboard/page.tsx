'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import NovelUploadForm from '@/components/admin-dashboard/NovelUploadForm';
import ChapterManagementForm from '@/components/admin-dashboard/ChapterManagementForm';
import RoleManagement from '@/components/admin-dashboard/RoleManagement';
import { Icon } from '@iconify/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('novels');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

      if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
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
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="p-4 lg:p-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('novels')}
              className={`py-2 px-4 ${
                activeTab === 'novels'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Novels
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`ml-4 lg:ml-8 py-2 px-4 ${
                activeTab === 'chapters'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Chapters
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`ml-4 lg:ml-8 py-2 px-4 ${
                activeTab === 'roles'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Manage Roles
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="min-h-full pb-8">
          {activeTab === 'novels' && <NovelUploadForm />}
          {activeTab === 'chapters' && <ChapterManagementForm />}
          {activeTab === 'roles' && <RoleManagement />}
        </div>
      </div>
    </div>
  );
} 