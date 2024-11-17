'use client';

import { Icon } from '@iconify/react';

export default function Badges() {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:medal" className="text-yellow-500" width="20" />
          <Icon icon="mdi:trophy" className="text-blue-500" width="20" />
          <Icon icon="mdi:star-circle" className="text-purple-500" width="20" />
          <Icon icon="mdi:shield-star" className="text-green-500" width="20" />
        </div>
        <span className="text-xs text-gray-400 ml-2">(Coming Soon)</span>
      </div>
    </div>
  );
} 