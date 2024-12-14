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
  totalReadingTime = 0,
  joinedDate,
  storiesRead = 0,
  bookmarkCount = 0,
}: StatusSectionProps) {
  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}m`;
    return `${hours}h ${minutes % 60}m`;
  };

  const statusCards = [
    {
      icon: 'heroicons:fire',
      label: 'Reading Streak',
      value: `${readingStreak} days`,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    },
    {
      icon: 'heroicons:clock',
      label: 'Reading Time',
      value: formatReadingTime(totalReadingTime),
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-500'
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
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {statusCards.map((card, index) => (
        <StatusCard key={index} {...card} />
      ))}
    </div>
  );
} 