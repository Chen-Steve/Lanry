import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Volume } from '@/types/novel';
import { UserProfile } from '@/types/database';
import { ChapterListItem } from '@/services/chapterService';

interface ChapterFilterBarProps {
  novelSlug: string;
  volumes: Volume[];
  volumeCounts: Map<string, { total: number }>;
  selectedVolumeId: string | null;
  setSelectedVolumeId: (id: string | null) => void;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  allAdvancedChapters: ChapterListItem[];
  onOpenBulkPurchase: () => void;
  activeFilterCount: number;
}

export const ChapterFilterBar = ({
  novelSlug,
  volumes,
  volumeCounts,
  selectedVolumeId,
  setSelectedVolumeId,
  isAuthenticated,
  userProfile,
  allAdvancedChapters,
  onOpenBulkPurchase,
  activeFilterCount
}: ChapterFilterBarProps) => {
  // Local dropdown state
  const [showVolumeDescription, setShowVolumeDescription] = useState(false);
  const volumeDropdownRef = useRef<HTMLDivElement>(null);
  const volumeDropdownMenuRef = useRef<HTMLDivElement>(null);
  const volumeButtonRef = useRef<HTMLButtonElement>(null);
  const [volumeButtonWidth, setVolumeButtonWidth] = useState(0);

  // Compute button width whenever the ref or selected volume changes
  useEffect(() => {
    if (volumeButtonRef.current) {
      setVolumeButtonWidth(volumeButtonRef.current.offsetWidth + 20);
    }
  }, [volumes, selectedVolumeId]);

  // Click-outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (volumeDropdownRef.current && volumeDropdownRef.current.contains(event.target as Node)) ||
        (volumeDropdownMenuRef.current && volumeDropdownMenuRef.current.contains(event.target as Node))
      ) {
        return;
      }
      setShowVolumeDescription(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Memoised selected volume for label
  const selectedVolume = useMemo(() => volumes.find(v => v.id === selectedVolumeId), [volumes, selectedVolumeId]);

  return (
    <div className="p-3 bg-accent/50 border-b border-border flex flex-col md:flex-row gap-3 relative">
      {/* Volume dropdown container */}
      {showVolumeDescription && volumes.length > 0 && (
        <div
          className="absolute left-3 top-[calc(100%-0.5rem)] bg-background border border-border rounded-lg shadow-lg max-h-[400px] overflow-y-auto z-50"
          style={{ width: volumeButtonWidth || 200, minWidth: 200 }}
          ref={volumeDropdownMenuRef}
        >
          <div className="p-1">
            <button
              onClick={() => {
                setSelectedVolumeId(null);
                setShowVolumeDescription(false);
              }}
              className={`w-full px-3 py-2 text-left rounded-md text-sm ${!selectedVolumeId ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            >
              <div className="flex items-center justify-between">
                <span>All Volumes</span>
                <span className="text-xs opacity-70">{volumeCounts.get('all')?.total || 0}</span>
              </div>
            </button>
            {volumes
              .sort((a, b) => a.volume_number - b.volume_number)
              .map(volume => (
                <button
                  key={volume.id}
                  onClick={() => {
                    setSelectedVolumeId(volume.id);
                    setShowVolumeDescription(false);
                  }}
                  className={`w-full px-3 py-2 text-left rounded-md text-sm ${selectedVolumeId === volume.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {volume.title ? `Vol ${volume.volume_number}: ${volume.title}` : `Volume ${volume.volume_number}`}
                    </span>
                    <span className="text-xs opacity-70">{volumeCounts.get(volume.id)?.total || 0}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible no-scrollbar">
        <Link
          href={`/novels/${novelSlug}`}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:border-primary/50 transition-colors"
        >
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
          <span>Back</span>
        </Link>

        {volumes.length > 0 && (
          <div className="relative inline-block flex-shrink-0" ref={volumeDropdownRef}>
            <button
              ref={volumeButtonRef}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:border-primary/50 transition-colors"
              onClick={() => setShowVolumeDescription(!showVolumeDescription)}
            >
              <Icon icon="solar:book-broken" className="w-4 h-4" />
              <span>
                {selectedVolumeId
                  ? selectedVolume?.title
                    ? `Vol ${selectedVolume?.volume_number}: ${selectedVolume.title}`
                    : `Volume ${selectedVolume?.volume_number}`
                  : 'All Volumes'}
              </span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4 opacity-70" />
            </button>
          </div>
        )}

        {/* Bulk Purchase */}
        {isAuthenticated && userProfile && allAdvancedChapters.length > 0 && (
          <button
            onClick={onOpenBulkPurchase}
            className="px-3 py-1.5 bg-primary text-primary-foreground border border-primary rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap hover:bg-primary/90 transition-colors"
          >
            <span>Bulk Purchase</span>
          </button>
        )}

        {/* Active filter indicator */}
        {activeFilterCount > 0 && (
          <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        )}

        {/* Reset filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => setSelectedVolumeId(null)}
            className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}; 