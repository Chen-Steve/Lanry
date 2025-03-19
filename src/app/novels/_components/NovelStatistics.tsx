import { Icon } from '@iconify/react';

const NovelStatistics = () => {
  const stats = [
    {
      icon: 'ph:books-duotone',
      label: 'Total Novels',
      value: 87,
      color: 'emerald'
    },
    {
      icon: 'ph:book-bookmark-duotone',
      label: 'Total Chapters',
      value: 6290,
      color: 'violet'
    },
    {
      icon: 'ph:check-circle-duotone',
      label: 'Completed',
      value: 11,
      color: 'rose'
    },
    {
      icon: 'ph:users-duotone',
      label: 'Translators',
      value: 31,
      color: 'amber'
    }
  ];

  return (
    <div className="mb-6">

      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center p-4 bg-card hover:bg-accent/50 rounded-lg transition-all duration-300 border-2 shadow-[0_0_10px_theme(colors.${stat.color}.400)] hover:shadow-[0_0_15px_theme(colors.${stat.color}.400)] border-${stat.color}-400`}
            >
              <Icon 
                icon={stat.icon} 
                className={`w-8 h-8 mb-2 text-${stat.color}-400`} 
              />
              <span className="text-2xl font-bold mb-1">
                {(stat.value ?? 0).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NovelStatistics; 