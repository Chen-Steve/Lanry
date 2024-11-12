'use client';

import { useState } from 'react';
import NovelUploadForm from '@/components/admin-dashboard/NovelUploadForm';
import ChapterManagementForm from '@/components/admin-dashboard/ChapterManagementForm';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('novels');

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
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
              Manage Novels
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`ml-4 lg:ml-8 py-2 px-4 ${
                activeTab === 'chapters'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Manage Chapters
            </button>
          </nav>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="min-h-full pb-8">
          {activeTab === 'novels' ? (
            <NovelUploadForm />
          ) : (
            <ChapterManagementForm />
          )}
        </div>
      </div>
    </div>
  );
} 