import { Icon } from '@iconify/react';

interface StatusCardProps {
  icon: string;
  label: string;
  value: string | number;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  textColor: string;
}

function StatusCard({ icon, label, value, gradientFrom, gradientTo, iconColor, textColor }: StatusCardProps) {
  return (
    <div className={`flex items-center gap-2 xs:gap-3 p-2 xs:p-3 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      <div className={`${iconColor} bg-white/10 w-6 xs:w-7 h-6 xs:h-7 rounded-md flex items-center justify-center backdrop-blur-[2px]`}>
        <Icon icon={icon} className="w-3.5 xs:w-4 h-3.5 xs:h-4" />
      </div>
      <div className="min-w-0">
        <p className={`text-[10px] xs:text-xs ${textColor}/60 truncate`}>{label}</p>
        <p className={`text-xs xs:text-sm font-semibold ${textColor} truncate`}>{value}</p>
      </div>
    </div>
  );
}

interface StatusSectionProps {
  readingStreak: number;
  totalReadingTime: number;
  joinedDate: string;
  storiesRead: number;
}

export default function StatusSection({ 
  totalReadingTime = 0,
  joinedDate,
  storiesRead = 0,
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
      gradientFrom: 'from-amber-500/10',
      gradientTo: 'to-amber-500/5',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-900 dark:text-amber-100'
    },
    {
      icon: 'heroicons:calendar',
      label: 'Member Since',
      value: joinedDate,
      gradientFrom: 'from-blue-500/10',
      gradientTo: 'to-blue-500/5',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      icon: 'heroicons:book-open',
      label: 'Stories Read',
      value: storiesRead,
      gradientFrom: 'from-emerald-500/10',
      gradientTo: 'to-emerald-500/5',
      iconColor: 'text-emerald-500',
      textColor: 'text-emerald-900 dark:text-emerald-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 xs:gap-2">
      {statusCards.map((card, index) => (
        <StatusCard key={index} {...card} />
      ))}
    </div>
  );
} 