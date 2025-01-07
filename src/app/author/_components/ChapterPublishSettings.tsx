import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ChapterPublishSettingsProps {
  publishAt: string;
  coins: string;
  onSettingsChange: (settings: { publishAt: string; coins: string }) => void;
  autoScheduleInterval: number;
  useAutoSchedule: boolean;
  autoScheduleTime: string;
  autoScheduleStartDate: string;
  onAutoScheduleChange: (settings: {
    enabled: boolean;
    interval: number;
    scheduleTime: string;
    startDate: string;
  }) => void;
  isNewChapter?: boolean;
  showSchedulePopup: boolean;
  onCloseSchedulePopup: () => void;
}

export default function ChapterPublishSettings({
  publishAt,
  coins,
  onSettingsChange,
  autoScheduleInterval = 7,
  useAutoSchedule = false,
  autoScheduleTime = '12:00',
  autoScheduleStartDate = '',
  onAutoScheduleChange,
  isNewChapter = false,
  showSchedulePopup = false,
  onCloseSchedulePopup
}: ChapterPublishSettingsProps) {
  // Auto-calculate publish date when auto-schedule is enabled
  useEffect(() => {
    if (isNewChapter && useAutoSchedule) {
      const lastPublishDate = new Date(publishAt || new Date());
      const nextPublishDate = new Date(lastPublishDate);
      nextPublishDate.setDate(nextPublishDate.getDate() + autoScheduleInterval);
      
      // Apply the scheduled time
      const [hours, minutes] = autoScheduleTime.split(':').map(Number);
      nextPublishDate.setHours(hours, minutes, 0, 0);
      
      onSettingsChange({
        publishAt: nextPublishDate.toISOString().slice(0, 16),
        coins
      });
    }
  }, [useAutoSchedule, autoScheduleInterval, autoScheduleTime, isNewChapter]);

  const handleAutoScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAutoScheduleChange?.({
      interval: parseInt(e.target.value) || 1,
      enabled: useAutoSchedule,
      scheduleTime: autoScheduleTime,
      startDate: autoScheduleStartDate
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAutoScheduleChange?.({
      interval: autoScheduleInterval,
      enabled: useAutoSchedule,
      scheduleTime: e.target.value,
      startDate: autoScheduleStartDate
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAutoScheduleChange?.({
      interval: autoScheduleInterval,
      enabled: useAutoSchedule,
      scheduleTime: autoScheduleTime,
      startDate: e.target.value
    });
  };

  return (
    <Dialog open={showSchedulePopup} onOpenChange={onCloseSchedulePopup}>
      <DialogContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Auto-schedule Settings</h3>
            <button
              onClick={onCloseSchedulePopup}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close settings"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Date</label>
              <div className="relative">
                <Icon icon="mdi:calendar" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={autoScheduleStartDate}
                  onChange={handleStartDateChange}
                  className="w-full pl-9 py-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary"
                  aria-label="Auto-schedule start date"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Select when you want to start auto-scheduling chapters
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Release Interval</label>
              <div className="relative">
                <Icon icon="mdi:clock-outline" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="1"
                  value={autoScheduleInterval}
                  onChange={handleAutoScheduleChange}
                  className="w-full pl-9 pr-12 py-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary"
                  aria-label="Auto-schedule interval in days"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">days</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Release Time</label>
              <div className="relative">
                <Icon icon="mdi:clock" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={autoScheduleTime}
                  onChange={handleTimeChange}
                  className="w-full pl-9 py-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary"
                  aria-label="Auto-schedule time of day"
                />
              </div>
            </div>

            <div className="p-3 bg-accent/50 rounded-lg border border-border/50">
              <div className="flex items-start gap-2">
                <Icon icon="mdi:information" className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Schedule Summary</p>
                  <p className="text-muted-foreground">
                    Chapters will be released every {autoScheduleInterval} days at {autoScheduleTime}
                    {autoScheduleStartDate && `, starting from ${new Date(autoScheduleStartDate).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 