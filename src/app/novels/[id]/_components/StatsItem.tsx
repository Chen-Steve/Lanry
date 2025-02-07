import { Icon } from '@iconify/react';

interface StatsItemProps {
  icon: string;
  value: string | number;
  label?: string;
  color?: 'blue' | 'purple' | 'gray';
  withGap?: boolean;
  className?: string;
}

export const StatsItem = ({ 
  icon, 
  value, 
  label,
  color = 'gray', 
  withGap = false,
  className = ''
}: StatsItemProps) => {
  const formattedValue = typeof value === 'number' 
    ? value >= 1000 
      ? `${(value / 1000).toFixed(1)}k` 
      : value.toString()
    : value;

  return (
    <div className={`flex items-center ${withGap ? 'gap-1' : ''} ${className}`}>
      <Icon 
        icon={icon} 
        className={`text-lg ${
          color === 'blue' 
            ? 'text-blue-600 dark:text-blue-400' 
            : color === 'purple' 
              ? 'text-purple-600 dark:text-purple-400' 
              : 'text-gray-600 dark:text-gray-400'
        }`} 
      />
      <div className="flex flex-col">
        <span className="text-gray-700 dark:text-gray-200">{formattedValue}</span>
        {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
      </div>
    </div>
  );
}; 