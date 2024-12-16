import React from 'react';
import { Icon } from '@iconify/react';

interface ChapterPublishSettingsProps {
  publishAt: string;
  coins: string;
  onSettingsChange: (settings: { publishAt: string; coins: string }) => void;
}

export default function ChapterPublishSettings({
  publishAt,
  coins,
  onSettingsChange
}: ChapterPublishSettingsProps) {
  return (
    <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 p-2 sm:p-4 bg-gray-50 rounded-lg">
      {/* Publish Date Section */}
      <div className="flex-1 space-y-1 sm:space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Schedule Publication
          <Icon 
            icon="mdi:calendar-clock" 
            className="inline-block ml-2 text-gray-500" 
          />
        </label>
        <input
          type="datetime-local"
          placeholder="Schedule Publication (Optional)"
          value={publishAt}
          onChange={(e) => {
            const newPublishAt = e.target.value;
            onSettingsChange({
              publishAt: newPublishAt,
              coins: newPublishAt ? coins : '0'
            });
          }}
          className="w-full p-2 sm:p-3 border rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs sm:text-sm text-gray-600">
          Set future date to make this an advanced chapter
        </p>
      </div>

      {/* Coins Section */}
      <div className="sm:w-1/3 space-y-1 sm:space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Early Access Cost
          <Icon 
            icon="ph:coins" 
            className="inline-block ml-2 text-gray-500" 
          />
        </label>
        <input
          type="number"
          min="1"
          placeholder="Set Cost"
          value={coins}
          disabled={!publishAt}
          onKeyDown={(e) => {
            if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const value = e.target.value.replace(/[eE]/g, '');
            onSettingsChange({ publishAt, coins: value });
          }}
          onBlur={(e) => {
            if (publishAt) {
              const value = parseInt(e.target.value) || 1;
              onSettingsChange({ publishAt, coins: Math.max(1, value).toString() });
            }
          }}
          className="w-full p-2 sm:p-3 border rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title={publishAt ? "Set coins required to access this chapter" : "Set publish date first to enable paid chapter"}
        />
        <p className="text-xs sm:text-sm text-gray-600">
          {publishAt 
            ? "Coins required for early access" 
            : "Set future date to enable coins"}
        </p>
      </div>
    </div>
  );
} 