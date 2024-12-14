import { Icon } from '@iconify/react';

interface StatusCardProps {
  icon: string;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}

export default function StatusCard({ icon, label, value, bgColor, iconColor }: StatusCardProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 ${bgColor} rounded-lg`}>
      <Icon icon={icon} className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-600">{label}</p>
        <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
} 