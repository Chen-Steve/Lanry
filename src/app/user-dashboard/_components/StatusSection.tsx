import { Icon } from '@iconify/react';

interface StatusCardProps {
  icon: string;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}

function StatusCard({ icon, label, value, bgColor, iconColor }: StatusCardProps) {
  const getBgColor = (color: string) => {
    switch (color) {
      case 'bg-orange-50':
        return 'bg-orange-50 dark:bg-orange-500/10';
      case 'bg-yellow-50':
        return 'bg-yellow-50 dark:bg-yellow-500/10';
      case 'bg-blue-50':
        return 'bg-blue-50 dark:bg-blue-500/10';
      case 'bg-green-50':
        return 'bg-green-50 dark:bg-green-500/10';
      case 'bg-purple-50':
        return 'bg-purple-50 dark:bg-purple-500/10';
      default:
        return bgColor;
    }
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 ${getBgColor(bgColor)} rounded-lg`}>
      <Icon icon={icon} className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        <p className="text-sm sm:text-base font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

interface StatusSectionProps {
  readingStreak: number;
  totalReadingTime: number;
  joinedDate: string;
  storiesRead: number;
  bookmarkCount: number;
}

export default function StatusSection({ 
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