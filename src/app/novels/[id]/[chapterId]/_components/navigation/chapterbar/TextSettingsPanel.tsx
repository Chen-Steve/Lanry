import { Icon } from '@iconify/react';
import TextCustomization from '../../interaction/TextCustomization';

interface TextSettingsPanelProps {
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  currentFont: string;
  currentSize: number;
  onBack: () => void;
}

export const TextSettingsPanel = ({
  onFontChange,
  onSizeChange,
  currentFont,
  currentSize,
  onBack
}: TextSettingsPanelProps) => {
  return (
    <>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3"
        aria-label="Back to main options"
      >
        <Icon icon="mdi:chevron-left" className="w-5 h-5" />
        Back
      </button>

      {/* Text settings content */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex-1 overflow-y-auto min-h-0">
        <TextCustomization
          onFontChange={onFontChange}
          onSizeChange={onSizeChange}
          currentFont={currentFont}
          currentSize={currentSize}
        />
      </div>
    </>
  );
};