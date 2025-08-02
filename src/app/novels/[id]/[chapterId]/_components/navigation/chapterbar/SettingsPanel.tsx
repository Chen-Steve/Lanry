import { Icon } from '@iconify/react';
import { ToggleSwitch } from './ToggleSwitch';

interface SettingsPanelProps {
  onTextSettingsClick: () => void;
  hideComments: boolean;
  onHideCommentsChange: (hide: boolean) => void;
  showProfanity: boolean;
  onShowProfanityChange: (show: boolean) => void;
}

export const SettingsPanel = ({
  onTextSettingsClick,
  hideComments,
  onHideCommentsChange,
  showProfanity,
  onShowProfanityChange
}: SettingsPanelProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-3">
      {/* Navigate to text settings */}
      <button
        onClick={onTextSettingsClick}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Open text settings"
      >
        <div className="flex items-center gap-2">
          <Icon icon="mdi:format-text" className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">Text Settings</span>
        </div>
        <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-500" />
      </button>

      {/* Zen mode toggle */}
      <div className="flex items-center justify-between p-2">
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Icon icon="mdi:meditation" className="w-4 h-4" />
          <span>Zen Mode</span>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Add zen mode functionality
          }}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none bg-gray-300 dark:bg-gray-700`}
          aria-label="Toggle zen mode"
        >
          <span
            className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform translate-x-1.5`}
          />
        </button>
      </div>

      {/* Comments toggle */}
      <ToggleSwitch
        label="Comments"
        icon="mdi:comment-outline"
        isOn={!hideComments}
        onToggle={() => onHideCommentsChange(!hideComments)}
        ariaLabel="Toggle comment icons"
      />

      {/* Profanity toggle */}
      <ToggleSwitch
        label="Profanity"
        icon="mdi:eye-off-outline"
        isOn={showProfanity}
        onToggle={() => onShowProfanityChange(!showProfanity)}
        ariaLabel="Toggle profanity visibility"
      />
    </div>
  );
};