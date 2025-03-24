import { Icon } from '@iconify/react';
import Link from 'next/link';

const NovelStatistics = () => {
  const stats = [
    {
      icon: 'ph:books-duotone',
      label: 'Total Novels',
      value: 89,
      color: 'emerald'
    },
    {
      icon: 'ph:book-bookmark-duotone',
      label: 'Total Chapters',
      value: 6600,
      color: 'violet'
    },
    {
      icon: 'ph:check-circle-duotone',
      label: 'Completed',
      value: 13,
      color: 'rose'
    },
    {
      icon: 'ph:users-duotone',
      label: 'Translators',
      value: 33,
      color: 'amber',
      href: '/translators'
    }
  ];

  return (
    <div className="mb-6">
      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const CardContent = (
              <div
                className={`flex flex-col items-center p-2 sm:p-4 bg-card hover:bg-accent/50 rounded-lg transition-all duration-300 border-2 shadow-[0_0_10px_theme(colors.${stat.color}.400)] hover:shadow-[0_0_15px_theme(colors.${stat.color}.400)] border-${stat.color}-400 ${stat.href ? 'cursor-pointer' : ''}`}
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
      </div>
    </div>
  );
};

export default NovelStatistics; 