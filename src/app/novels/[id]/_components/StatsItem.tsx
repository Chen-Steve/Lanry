import { Icon } from '@iconify/react';

interface StatsItemProps {
  icon: string;
  value: string;
  color?: 'blue' | 'purple' | 'gray';
  withGap?: boolean;
  className?: string;
}

export const StatsItem = ({ 
  icon, 
  value, 
  color = 'gray', 
  withGap = false,
  className = ''
}: StatsItemProps) => (
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
    <span className="text-gray-700 dark:text-gray-200">{value}</span>
  </div>
); 