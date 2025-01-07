import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';

interface ChapterPublishSettingsProps {
  publishAt: string;
  coins: string;
  onSettingsChange: (settings: { publishAt: string; coins: string }) => void;
  autoScheduleInterval?: number;
  useAutoSchedule?: boolean;
  onAutoScheduleChange?: (settings: { 
    interval: number; 
    enabled: boolean;
    scheduleTime?: string; 
  }) => void;
  isNewChapter?: boolean;
  autoScheduleTime?: string;
  showSchedulePopup?: boolean;
  onCloseSchedulePopup?: () => void;
}

export default function ChapterPublishSettings({
  publishAt,
  coins,
  onSettingsChange,
  autoScheduleInterval = 7,
  useAutoSchedule = false,
  onAutoScheduleChange,
  isNewChapter = false,
  autoScheduleTime = '12:00',
  showSchedulePopup = false,
  onCloseSchedulePopup
}: ChapterPublishSettingsProps) {
  // Auto-calculate publish date when auto-schedule is enabled
  useEffect(() => {
    if (isNewChapter && useAutoSchedule && onAutoScheduleChange) {
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

  return (
    <>
      {/* Schedule Settings Popup */}
      {showSchedulePopup && onAutoScheduleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCloseSchedulePopup} />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Chapter Settings</h3>
              <button
                type="button"
                onClick={onCloseSchedulePopup}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close schedule settings"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Auto Schedule Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:calendar-clock" className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">Schedule Publication</h4>
                </div>
                
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoSchedule}
                    onChange={(e) => onAutoScheduleChange({ 
                      interval: autoScheduleInterval,
                      enabled: e.target.checked,
                      scheduleTime: autoScheduleTime
                    })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Enable Auto-scheduling
                </label>

                {useAutoSchedule ? (
                  <div className="space-y-4 p-4 bg-accent rounded-lg">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Release Interval</label>
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:calendar-refresh" className="w-5 h-5 text-muted-foreground" />
                        <input
                          type="number"
                          min="1"
                          value={autoScheduleInterval}
                          onChange={(e) => onAutoScheduleChange({ 
                            interval: parseInt(e.target.value) || 1,
                            enabled: useAutoSchedule,
                            scheduleTime: autoScheduleTime
                          })}
                          className="w-20 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary"
                          aria-label="Auto-schedule interval in days"
                        />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Release Time</label>
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:clock-outline" className="w-5 h-5 text-muted-foreground" />
                        <input
                          type="time"
                          value={autoScheduleTime}
                          onChange={(e) => onAutoScheduleChange({
                            interval: autoScheduleInterval,
                            enabled: useAutoSchedule,
                            scheduleTime: e.target.value
                          })}
                          className="w-32 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary"
                          aria-label="Auto-schedule time of day"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 bg-accent rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:calendar" className="w-5 h-5 text-muted-foreground" />
                        <input
                          type="datetime-local"
                          value={publishAt}
                          onChange={(e) => {
                            const newPublishAt = e.target.value;
                            onSettingsChange({
                              publishAt: newPublishAt,
                              coins: newPublishAt ? coins : '0'
                            });
                          }}
                          className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary"
                          aria-label="Publication date and time"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {useAutoSchedule && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon icon="mdi:information" className="w-4 h-4" />
                    Chapters will be automatically scheduled for release every {autoScheduleInterval} days at {autoScheduleTime}
                  </p>
                )}
              </div>

              {/* Early Access Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon icon="ph:coins" className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">Early Access</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Cost in Coins</label>
                    {!publishAt && (
                      <span className="text-xs text-muted-foreground">
                        Set schedule first to enable
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Set Cost"
                    value={coins}
                    disabled={!publishAt}
                    onKeyDown={(e) => {
                      if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[eE]/g, '');
                      onSettingsChange({ publishAt, coins: value });
                    }}
                    onBlur={(e) => {
                      if (publishAt) {
                        const value = parseInt(e.target.value) || 1;
                        onSettingsChange({ publishAt, coins: Math.max(1, value).toString() });
                      }
                    }}
                    className="w-full p-2 text-sm border border-border rounded bg-background text-foreground disabled:bg-accent disabled:text-muted-foreground disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                    title={publishAt ? "Set coins required to access this chapter" : "Set publish date first to enable paid chapter"}
                  />
                  {publishAt && coins !== '0' && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon icon="mdi:information" className="w-3.5 h-3.5" />
                      Readers will need {coins} coins for early access
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border bg-accent/50">
              <button
                type="button"
                onClick={onCloseSchedulePopup}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 