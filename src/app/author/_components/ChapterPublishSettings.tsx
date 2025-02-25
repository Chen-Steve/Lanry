import React, { useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { formatLocalDateTime, toLocalDatetimeValue, isFutureDate } from '@/utils/dateUtils';

interface ChapterPublishSettingsProps {
  publishAt: string;
  coins: string;
  onSettingsChange: (settings: { publishAt: string; coins: string }) => void;
  showSchedulePopup?: boolean;
  onCloseSchedulePopup?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function ChapterPublishSettings({
  publishAt,
  coins,
  onSettingsChange,
  showSchedulePopup = false,
  onCloseSchedulePopup,
  onSave,
  isSaving = false,
}: ChapterPublishSettingsProps) {
  // Generate time options in 30-minute intervals
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const period = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const hourStr = displayHour.toString();
        const minStr = minute.toString().padStart(2, '0');
        // Store in 24h format but display in 12h
        const value = `${hour.toString().padStart(2, '0')}:${minStr}`;
        const label = `${hourStr}:${minStr} ${period}`;
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  const getCurrentTimeValue = (date: string | null) => {
    if (!date) return '';
    // Parse time directly from ISO string to avoid timezone conversion
    const timeStr = date.split('T')[1];
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const handleDateTimeChange = (type: 'date' | 'time', value: string) => {
    let year, month, day, hours, minutes;

    if (publishAt) {
      // Parse existing date
      const [datePart, timePart] = publishAt.split('T');
      [year, month, day] = datePart.split('-').map(Number);
      [hours, minutes] = timePart.split(':').map(Number);
    } else {
      // Use current date
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
      day = now.getDate();
      hours = now.getHours();
      minutes = now.getMinutes();
    }

    if (type === 'date') {
      // Update just the date portion
      [year, month, day] = value.split('-').map(Number);
    } else if (type === 'time') {
      // Update just the time portion
      [hours, minutes] = value.split(':').map(Number);
    }

    // Create ISO string without timezone suffix to keep it local
    const isoString = `${year}-${
      month.toString().padStart(2, '0')
    }-${
      day.toString().padStart(2, '0')
    }T${
      hours.toString().padStart(2, '0')
    }:${
      minutes.toString().padStart(2, '0')
    }:00.000`;

    onSettingsChange({
      publishAt: isoString,
      coins: coins
    });
  };

  useEffect(() => {
    // When publishAt is set to a future date and coins is 0, set it to default from localStorage
    if (publishAt && isFutureDate(publishAt) && (coins === '0' || !coins)) {
      const defaultCoins = localStorage.getItem('defaultChapterCoins') || '1';
      onSettingsChange({ publishAt, coins: defaultCoins });
    }
  }, [publishAt, coins, onSettingsChange]);

  return (
    <>
      {/* Schedule Settings Popup */}
      {showSchedulePopup && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={onCloseSchedulePopup} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 pointer-events-auto">
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
                {/* Publication Date Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">Schedule Publication</h4>
                  </div>
                  
                  <div className="space-y-4 p-4 bg-accent rounded-lg">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={publishAt ? toLocalDatetimeValue(publishAt).split('T')[0] : ''}
                            onChange={(e) => handleDateTimeChange('date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary relative hover:cursor-pointer"
                            style={{ colorScheme: 'dark' }}
                            aria-label="Publication date"
                          />
                          <select
                            value={getCurrentTimeValue(publishAt)}
                            onChange={(e) => handleDateTimeChange('time', e.target.value)}
                            className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary relative hover:cursor-pointer"
                            style={{ colorScheme: 'dark' }}
                            aria-label="Publication time"
                          >
                            <option value="">Select time</option>
                            {timeOptions.map((time) => (
                              <option key={time.value} value={time.value}>
                                {time.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {publishAt && (
                          <p className="text-xs text-muted-foreground pl-7">
                            Will be released at: {formatLocalDateTime(publishAt)}
                            <br />
                            <span className="text-xs text-primary">
                              (Releases at this local time for all readers in their timezone)
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
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
                  disabled={isSaving}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (onSave) {
                      await onSave();
                      onCloseSchedulePopup?.();
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-background bg-primary border border-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon icon="mdi:content-save" className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
} 