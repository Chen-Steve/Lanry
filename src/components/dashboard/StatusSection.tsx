import StatusCard from './StatusCard';

interface StatusSectionProps {
  readingStreak: number;
  totalReadingTime: number;
  joinedDate: string;
  storiesRead: number;
  bookmarkCount: number;
}

export default function StatusSection({ 
  readingStreak = 0,
  joinedDate,
  storiesRead = 0,
  bookmarkCount = 0,
}: StatusSectionProps) {
  const statusCards = [
    {
      icon: 'heroicons:fire',
      label: 'Reading Streak',
      value: `${readingStreak} days`,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    },
    {
      icon: 'heroicons:calendar',
      label: 'Joined',
      value: joinedDate,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    {
      icon: 'heroicons:book-open',
      label: 'Stories Read',
      value: storiesRead,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500'
    },
    {
      icon: 'heroicons:bookmark',
      label: 'Bookmarks',
      value: bookmarkCount,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {statusCards.map((card, index) => (
        <StatusCard key={index} {...card} />
      ))}
    </div>
  );
} 