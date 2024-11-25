'use client';

import { Icon } from '@iconify/react';

const NoticeBoard = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <Icon icon="mdi:bulletin-board" className="text-xl text-blue-600" />
        <h2 className="text-lg font-semibold text-blue-900">Notice Board</h2>
      </div>
      <p className="text-sm text-blue-700 mt-2">
        Welcome to our novel translation platform! Check here for important announcements and updates.
      </p>
    </div>
  );
};

export default NoticeBoard; 