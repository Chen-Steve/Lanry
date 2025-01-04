import { Icon } from '@iconify/react';

interface StatusCardProps {
  icon: string;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}

export default function StatusCard({ icon, label, value, bgColor, iconColor }: StatusCardProps) {
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