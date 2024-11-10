'use client';

import { useState } from 'react';
import NovelUploadForm from '@/components/NovelUploadForm';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('novels');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem('adminAuthenticated');
            window.location.href = '/admin/login';
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
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
      </div>

      <div>
        {activeTab === 'novels' ? (
          <NovelUploadForm />
        ) : (
          <div>Chapter management component will go here</div>
        )}
      </div>
    </div>
  );
} 