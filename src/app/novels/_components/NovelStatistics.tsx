import { Icon } from '@iconify/react';
import Link from 'next/link';

const NovelStatistics = () => {
  const stats = [
    {
      icon: 'ph:books-duotone',
      label: 'Total Novels',
      value: 160,
      color: 'amber',
      bgImage: 'https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section/novels.jpg'
    },
    {
      icon: 'ph:book-bookmark-duotone',
      label: 'Total Chapters',
      value: 10895,
      color: 'amber',
      bgImage: 'https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section/chapters.avif'
    },
    {
      icon: 'ph:check-circle-duotone',
      label: 'Completed',
      value: 42,
      color: 'amber',
      bgImage: 'https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section/completed.jpg'
    },
    {
      icon: 'ph:users-duotone',
      label: 'Translators',
      value: 48,
      color: 'amber',
      href: '/translators',
      bgImage: 'https://vkgkhipasxqxitwlktwz.supabase.co/storage/v1/object/public/stat-section/translators.jpg'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((stat) => {
        const CardContent = (
          <div
            className={`flex flex-col items-center p-4 sm:p-4 rounded-lg relative overflow-hidden`}
            style={stat.bgImage ? {
              backgroundImage: `url(${stat.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            {stat.bgImage && (
              <div className="absolute inset-0 bg-black/40 z-0" />
            )}
            <Icon 
              icon={stat.icon} 
              className={`w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-${stat.color}-400 relative z-10`} 
            />
            <span className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 relative z-10 text-white">
              {(stat.value ?? 0).toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-white text-center relative z-10">
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