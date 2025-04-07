import { Icon } from '@iconify/react';
import Link from 'next/link';

const NovelStatistics = () => {
  const stats = [
    {
      icon: 'ph:books-duotone',
      label: 'Total Novels',
      value: 110,
      color: 'emerald'
    },
    {
      icon: 'ph:book-bookmark-duotone',
      label: 'Total Chapters',
      value: 8321,
      color: 'violet'
    },
    {
      icon: 'ph:check-circle-duotone',
      label: 'Completed',
      value: 18,
      color: 'rose'
    },
    {
      icon: 'ph:users-duotone',
      label: 'Translators',
      value: 36,
      color: 'amber',
      href: '/translators'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2 mb-4 mt-4">
      {stats.map((stat) => {
        const CardContent = (
          <div
            className={`flex flex-col items-center p-2 sm:p-4 rounded-lg border-2 border-black`}
          >
            <Icon 
              icon={stat.icon} 
              className={`w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-${stat.color}-400`} 
            />
            <span className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1">
              {(stat.value ?? 0).toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              {stat.label}
            </span>
          </div>
        );

        return stat.href ? (
          <Link key={stat.label} href={stat.href}>
            {CardContent}
          </Link>
        ) : (
          <div key={stat.label}>
            {CardContent}
          </div>
        );
      })}
    </div>
  );
};

export default NovelStatistics; 