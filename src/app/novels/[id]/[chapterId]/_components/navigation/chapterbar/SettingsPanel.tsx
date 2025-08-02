import { Icon } from '@iconify/react';
import { ToggleSwitch } from './ToggleSwitch';

interface SettingsPanelProps {
  onTextSettingsClick: () => void;
  hideComments: boolean;
  onHideCommentsChange: (hide: boolean) => void;
  showProfanity: boolean;
  onShowProfanityChange: (show: boolean) => void;
  zenMode: boolean;
  onZenModeChange: (zen: boolean) => void;
}

export const SettingsPanel = ({
  onTextSettingsClick,
  hideComments,
  onHideCommentsChange,
  showProfanity,
  onShowProfanityChange,
  zenMode,
  onZenModeChange
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
      <ToggleSwitch
        label="Zen Mode"
        icon="mdi:meditation"
        isOn={zenMode}
        onToggle={() => onZenModeChange(!zenMode)}
        ariaLabel="Toggle zen mode"
      />

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