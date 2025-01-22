import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { ChapterListChapter } from '../_types/authorTypes';
import { toast } from 'react-hot-toast';

interface VolumeModalProps {
  isOpen: boolean;
  volumeName: string;
  volumeNumber: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onVolumeNameChange: (value: string) => void;
  onVolumeNumberChange: (value: string) => void;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

interface AssignChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  chapters: ChapterListChapter[];
  selectedChapterIds: Set<string>;
  toggleChapterSelection: (chapterId: string) => void;
  onAssign: () => void;
}

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
}

export function VolumeModal({
  isOpen,
  volumeName,
  volumeNumber,
  onClose,
  onSubmit,
  onVolumeNameChange,
  onVolumeNumberChange
}: VolumeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
        <h3 className="text-lg font-medium text-foreground mb-4">Create New Volume</h3>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="volumeNumber" className="block text-sm font-medium text-foreground mb-1">
                Volume Number
              </label>
              <input
                type="number"
                id="volumeNumber"
                value={volumeNumber}
                onChange={(e) => onVolumeNumberChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Enter volume number"
                required
                min="1"
              />
            </div>
            <div>
              <label htmlFor="volumeName" className="block text-sm font-medium text-foreground mb-1">
                Volume Title
              </label>
              <input
                type="text"
                id="volumeName"
                value={volumeName}
                onChange={(e) => onVolumeNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Enter volume title"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Create Volume
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-sm border border-border shadow-lg">
        <h3 className="text-lg font-medium text-foreground mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssignChaptersModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  chapters,
  selectedChapterIds,
  toggleChapterSelection,
  onAssign
}: AssignChaptersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-2xl border border-border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Assign Chapters to Volume</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chapters..."
            className="w-full px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto border border-border rounded-md divide-y divide-border">
          {chapters
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .filter(chapter => 
              chapter.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              `Chapter ${chapter.chapter_number}${chapter.part_number ? ` Part ${chapter.part_number}` : ''}`.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(chapter => (
              <div
                key={chapter.id}
                className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => toggleChapterSelection(chapter.id)}
              >
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedChapterIds.has(chapter.id)}
                    onChange={() => toggleChapterSelection(chapter.id)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-background"
                    aria-label={`Select Chapter ${chapter.chapter_number}${chapter.part_number ? ` Part ${chapter.part_number}` : ''}`}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    Chapter {chapter.chapter_number}
                    {chapter.part_number && (
                      <span className="text-muted-foreground">
                        {" "}Part {chapter.part_number}
                      </span>
                    )}
                    {chapter.title && (
                      <span className="text-muted-foreground ml-1">: {chapter.title}</span>
                    )}
                  </h4>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={selectedChapterIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Assign {selectedChapterIds.size} {selectedChapterIds.size === 1 ? 'Chapter' : 'Chapters'}
          </button>
        </div>
      </div>
    </div>
  );
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
}: GlobalSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(settings);
    onClose();
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
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
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
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 