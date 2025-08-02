import { Icon } from '@iconify/react';

interface ToggleSwitchProps {
  label: string;
  icon: string;
  isOn: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export const ToggleSwitch = ({ 
  label, 
  icon, 
  isOn, 
  onToggle, 
  ariaLabel 
}: ToggleSwitchProps) => {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
        <Icon icon={icon} className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
          isOn ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
        }`}
        aria-label={ariaLabel}
      >
        <span
          className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-1.5'
          }`}
        />
      </button>
    </div>
  );
};