'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';

const NoticeBoard = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Icon icon="mdi:bulletin-board" className="text-xl text-blue-600" />
        <h2 className="text-lg font-semibold text-blue-900">Notice Board</h2>
        <Icon 
          icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
          className="ml-auto text-blue-600"
        />
      </div>
      
      {isExpanded && (
        <p className="text-sm text-blue-700 mt-2">
          updates here..
        </p>
      )}
    </div>
  );
};

export default NoticeBoard; 