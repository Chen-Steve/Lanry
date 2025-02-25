import React, { useEffect, useMemo, useState } from 'react';
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
  const [isIndefinitelyLocked, setIsIndefinitelyLocked] = useState(() => {
    // Check if publishAt is set to a far future date (e.g., > 50 years from now)
    if (!publishAt) return false;
    const date = new Date(publishAt);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    return date > fiftyYearsFromNow;
  });

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

  // Effect to handle indefinite lock changes
  useEffect(() => {
    if (isIndefinitelyLocked) {
      // Set a far future date (e.g., 100 years from now) when indefinitely locked
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
      onSettingsChange({
        publishAt: farFutureDate.toISOString(),
        coins: '0' // Set coins to 0 since it can't be purchased
      });
    } else {
      // When unlocking, set to tomorrow by default if no previous date exists
      // or if the current date is far in the future (was indefinitely locked)
      const currentDate = publishAt ? new Date(publishAt) : new Date();
      const isFarFuture = currentDate.getFullYear() > new Date().getFullYear() + 50;
      
      if (!publishAt || isFarFuture) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        onSettingsChange({
          publishAt: tomorrow.toISOString(),
          coins: localStorage.getItem('defaultChapterCoins') || '1'
        });
      }
    }
  }, [isIndefinitelyLocked, onSettingsChange, publishAt]);

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
                {/* Indefinite Lock Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium text-foreground">Keep Locked Indefinitely</h4>
                      <p className="text-xs text-muted-foreground">Chapter will remain locked until manually unlocked</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isIndefinitelyLocked}
                        onChange={(e) => setIsIndefinitelyLocked(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Keep chapter locked indefinitely"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {isIndefinitelyLocked && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:information" className="text-yellow-600 dark:text-yellow-500 mt-0.5" />
                        <div className="text-xs text-yellow-700 dark:text-yellow-400">
                          <p className="font-medium mb-1">This chapter will:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Not be available for purchase</li>
                            <li>Remain locked until you manually unlock it</li>
                            <li>Show as Coming Soon to readers</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Publication Date Section - Only show if not indefinitely locked */}
                {!isIndefinitelyLocked && (
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
                              value={!isIndefinitelyLocked && publishAt ? toLocalDatetimeValue(publishAt).split('T')[0] : ''}
                              onChange={(e) => handleDateTimeChange('date', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary relative hover:cursor-pointer"
                              style={{ colorScheme: 'dark' }}
                              aria-label="Publication date"
                              disabled={isIndefinitelyLocked}
                            />
                            
                            <select
                              value={getCurrentTimeValue(publishAt)}
                              onChange={(e) => handleDateTimeChange('time', e.target.value)}
                              className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary relative hover:cursor-pointer"
                              style={{ colorScheme: 'dark' }}
                              aria-label="Publication time"
                              disabled={isIndefinitelyLocked}
                            >
                              <option value="">Select time</option>
                              {timeOptions.map((time) => (
                                <option key={time.value} value={time.value}>
                                  {time.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {publishAt && !isIndefinitelyLocked && (
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
                )}

                {/* Early Access Section - Only show if not indefinitely locked */}
                {!isIndefinitelyLocked && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:coins" className="w-5 h-5 text-primary" />
                      <h4 className="text-sm font-medium text-foreground">Early Access</h4>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground">Cost in Coins</label>
                      </div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Set Cost"
                        value={coins}
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
                          const value = parseInt(e.target.value) || 1;
                          onSettingsChange({ publishAt, coins: Math.max(1, value).toString() });
                        }}
                        className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        title="Set coins required to access this chapter"
                      />
                      {coins !== '0' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon icon="mdi:information" className="w-3.5 h-3.5" />
                          Readers will need coins for early access
                        </p>
                      )}
                    </div>
                  </div>
                )}
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