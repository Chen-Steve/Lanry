'use client';

import { useState } from 'react';

const NoticeBoard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Notice Board Button */}
      <button
        aria-label="Notice Board"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 h-10 px-4 rounded-lg border border-black bg-white hover:scale-105 transition-transform z-50 flex items-center justify-center gap-2"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-black text-sm font-medium">Notice</span>
      </button>

      {/* Expandable Notice Board */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] border border-black rounded-lg bg-white shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4 min-h-[176px]">
            {/* Important Notice Section */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Important
              </h3>
              <div className="text-sm text-gray-700">
                &quot;I Became the Admiral of the French Navy&quot; was taken down as requested by Munpia
              </div>
            </div>

            {/* Devlog Section */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                TODO
              </h3>
              <div className="text-sm text-gray-700">
                notification system
              </div>
              <div className="text-sm text-gray-700">
                login with discord, google
              </div>
            </div>

            {/* Updates Section */}
            <div>
              <h3 className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Updates
              </h3>
              <div className="text-sm text-gray-700">
                New novels coming next week
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoticeBoard; 