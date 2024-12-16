import React from 'react';

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
    <div className="flex gap-4">
      <div className="flex-1">
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
          className="w-full p-3 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Set a future date to make this an advanced chapter
        </p>
      </div>
      <div className="w-1/3">
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
          className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
          title={publishAt ? "Set coins required to access this chapter" : "Set publish date first to enable paid chapter"}
        />
        <p className="text-sm text-gray-600 mt-1">
          {publishAt 
            ? "Coins required for early access" 
            : "Set future date to enable coins"}
        </p>
      </div>
    </div>
  );
} 