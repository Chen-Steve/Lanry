import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: {
    releaseInterval: number;
    fixedPrice: number;
    autoReleaseEnabled: boolean;
    fixedPriceEnabled: boolean;
  }) => void;
  initialSettings?: {
    releaseInterval: number;
    fixedPrice: number;
    autoReleaseEnabled: boolean;
    fixedPriceEnabled: boolean;
  };
  isLoading?: boolean;
  isSaving?: boolean;
}

export function DefaultCoinsModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (coins: number) => void;
}) {
  const [defaultCoins, setDefaultCoins] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('defaultChapterCoins');
    return saved || '1';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coins = parseInt(defaultCoins);
    if (coins < 1) {
      toast.error('Coins must be at least 1');
      return;
    }
    // Save to localStorage
    localStorage.setItem('defaultChapterCoins', defaultCoins);
    onSubmit(coins);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[eE]/g, '');
    setDefaultCoins(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-background border border-border rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Set Default Coins</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Default Coins for Advanced Chapters</label>
            <input
              type="number"
              min="1"
              value={defaultCoins}
              title="Set default coin price for advanced chapters"
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                  e.preventDefault();
                }
              }}
              className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              This will set the coin price for all future advanced chapters.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GlobalSettingsModal({
  isOpen,
  onClose,
  onSubmit,
  initialSettings = {
    releaseInterval: 7,
    fixedPrice: 10,
    autoReleaseEnabled: false,
    fixedPriceEnabled: false,
  },
  isLoading = false,
  isSaving = false,
}: GlobalSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);

  // Update settings when initialSettings change
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-background border border-border rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Global Chapter Settings</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
            disabled={isSaving}
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto Release Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Auto Chapter Release</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoReleaseEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, autoReleaseEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                    aria-label="Enable auto chapter release"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {settings.autoReleaseEnabled && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Release Interval (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.releaseInterval}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        releaseInterval: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Release interval in days"
                    aria-label="Release interval in days"
                  />
                  <p className="text-xs text-muted-foreground">
                    Chapters will automatically unlock after this many days from the last release
                  </p>
                </div>
              )}
            </div>

            {/* Fixed Price Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Fixed Chapter Pricing</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.fixedPriceEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, fixedPriceEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                    aria-label="Enable fixed chapter pricing"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {settings.fixedPriceEnabled && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Fixed Price (coins)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.fixedPrice}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fixedPrice: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Fixed price in coins"
                    aria-label="Fixed price in coins"
                  />
                  <p className="text-xs text-muted-foreground">
                    All new locked chapters will use this price automatically
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 