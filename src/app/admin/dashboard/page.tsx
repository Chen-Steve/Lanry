'use client';

import { useState } from 'react';
import NovelUploadForm from '@/components/NovelUploadForm';
import ChapterManagementForm from '@/components/ChapterManagementForm';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('novels');

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white">
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
            className={`ml-8 py-2 px-4 ${
              activeTab === 'chapters'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage Chapters
          </button>
        </nav>
      </div>

      <div className="flex-1 p-6 bg-gray-50">
        {activeTab === 'novels' ? (
          <NovelUploadForm />
        ) : (
          <ChapterManagementForm />
        )}
      </div>
    </div>
  );
} 