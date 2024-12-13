import { Icon } from '@iconify/react';

interface StatusSectionProps {
  readingStreak: number;
  totalReadingTime: number;
  joinedDate: string;
  storiesRead: number;
  bookmarkCount: number;
}

export default function StatusSection({ 
  readingStreak = 0,
  //totalReadingTime = 0,
  joinedDate,
  storiesRead = 0,
  bookmarkCount = 0,
}: StatusSectionProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
        <Icon icon="heroicons:fire" className="w-5 h-5 text-orange-500" />
        <div>
          <p className="text-xs text-gray-600">Reading Streak</p>
          <p className="text-base font-bold text-gray-900">{readingStreak} days</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <Icon icon="heroicons:calendar" className="w-5 h-5 text-blue-500" />
        <div>
          <p className="text-xs text-gray-600">Joined</p>
          <p className="text-base font-bold text-gray-900">{joinedDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
        <Icon icon="heroicons:book-open" className="w-5 h-5 text-green-500" />
        <div>
          <p className="text-xs text-gray-600">Stories Read</p>
          <p className="text-base font-bold text-gray-900">{storiesRead}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
        <Icon icon="heroicons:bookmark" className="w-5 h-5 text-purple-500" />
        <div>
          <p className="text-xs text-gray-600">Bookmarks</p>
          <p className="text-base font-bold text-gray-900">{bookmarkCount}</p>
        </div>
      </div>
    </div>
  );
} 