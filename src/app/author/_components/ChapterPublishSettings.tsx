import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { toLocalDatetimeValue, isFutureDate } from '@/utils/dateUtils';
import Calendar from './Calendar';

interface ChapterPublishSettingsProps {
  publishAt: string;
  coins: string;
  onSettingsChange: (settings: { publishAt: string; coins: string }) => void;
  showSchedulePopup?: boolean;
  onCloseSchedulePopup?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  autoReleaseEnabled?: boolean;
  advancedDates?: { date: Date; chapterNumber: number }[];
}

export default function ChapterPublishSettings({
  publishAt,
  coins,
  onSettingsChange,
  showSchedulePopup = false,
  onCloseSchedulePopup,
  onSave,
  isSaving = false,
  autoReleaseEnabled = false,
  advancedDates = [],
}: ChapterPublishSettingsProps) {
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // More stable way to initialize isIndefinitelyLocked
  const isIndefiniteLock = (date: string | null): boolean => {
    if (!date) return false;
    const publishDate = new Date(date);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    return publishDate > fiftyYearsFromNow;
  };
  
  const [isIndefinitelyLocked, setIsIndefinitelyLocked] = useState(() => isIndefiniteLock(publishAt));
  
  // Update isIndefinitelyLocked if publishAt changes from outside
  useEffect(() => {
    if (!hasBeenTouched) {
      setIsIndefinitelyLocked(isIndefiniteLock(publishAt));
    }
  }, [publishAt, hasBeenTouched]);

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
    setHasBeenTouched(true);
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

  // Effect to handle auto-release enabled state - only when that state changes
  useEffect(() => {
    // Skip if no touch action yet or if indefinitely locked (handled by toggle)
    if (!hasBeenTouched || isIndefinitelyLocked) return;

    // If auto-release is enabled and no coins are set, set default coins
    if (autoReleaseEnabled && (!coins || coins === '0')) {
      const defaultCoins = localStorage.getItem('defaultChapterCoins') || '1';
      onSettingsChange({ publishAt, coins: defaultCoins });
    }
  }, [autoReleaseEnabled, isIndefinitelyLocked, coins, publishAt, onSettingsChange, hasBeenTouched]);

  // Effect to handle publishAt changes when it's set to a future date
  useEffect(() => {
    // Skip if changing to indefinite lock or no publish date
    if (isIndefinitelyLocked || !publishAt || !hasBeenTouched) return;
    
    // When publishAt is set to a future date and no coins are set, use default from localStorage
    // But don't override if coins were explicitly set to 0
    if (isFutureDate(publishAt) && !coins) {
      const defaultCoins = localStorage.getItem('defaultChapterCoins') || '1';
      onSettingsChange({ publishAt, coins: defaultCoins });
    }
  }, [publishAt, coins, onSettingsChange, isIndefinitelyLocked, hasBeenTouched]);

  // Safety effect to ensure indefinitely locked chapters always have zero coins
  useEffect(() => {
    if (isIndefinitelyLocked && coins !== '0' && hasBeenTouched) {
      onSettingsChange({ publishAt, coins: '0' });
    }
  }, [isIndefinitelyLocked, coins, publishAt, onSettingsChange, hasBeenTouched]);

  return (
    <>
      {/* Schedule Settings Popup */}
      {showSchedulePopup && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => {
            setHasBeenTouched(true);
            onCloseSchedulePopup?.();
          }} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 pointer-events-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Chapter Settings</h3>
                <button
                  type="button"
                  onClick={() => {
                    setHasBeenTouched(true);
                    onCloseSchedulePopup?.();
                  }}
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
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          
                          // Set touched first
                          setHasBeenTouched(true);
                          
                          // Set the locked state immediately to update UI
                          setIsIndefinitelyLocked(newValue);
                          
                          // Use setTimeout to ensure state updates complete first
                          setTimeout(() => {
                            if (newValue) {
                              // Setting to indefinitely locked
                              const farFutureDate = new Date();
                              farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
                              onSettingsChange({
                                publishAt: farFutureDate.toISOString(),
                                coins: '0'
                              });
                            } else {
                              // Removing indefinite lock
                              const currentDate = publishAt ? new Date(publishAt) : new Date();
                              const isFarFuture = currentDate.getFullYear() > new Date().getFullYear() + 50;
                              
                              if (isFarFuture) {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(0, 0, 0, 0);
                                onSettingsChange({
                                  publishAt: tomorrow.toISOString(),
                                  coins: localStorage.getItem('defaultChapterCoins') || '1'
                                });
                              }
                            }
                          }, 0);
                        }}
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
                      {autoReleaseEnabled && (
                        <div className="mb-3 p-2 bg-primary/10 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Icon icon="mdi:information-outline" className="text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-primary">
                              Auto-release is enabled. This date will be calculated based on your global settings when you save the chapter.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="date"
                                value={!isIndefinitelyLocked && publishAt ? toLocalDatetimeValue(publishAt).split('T')[0] : ''}
                                onChange={(e) => handleDateTimeChange('date', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="flex-1 w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary relative hover:cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                                aria-label="Publication date"
                                disabled={isIndefinitelyLocked}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowCalendar(true);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCalendar(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isIndefinitelyLocked}
                                title="Open calendar"
                              >
                                <Icon icon="mdi:calendar" className="w-5 h-5" />
                              </button>
                            </div>
                            
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
                        
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Early Access Section - Only show if not indefinitely locked */}
                {!isIndefinitelyLocked && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon icon="ph:coins" className="w-5 h-5 text-primary" />
                      <h4 className="text-sm font-medium text-foreground">Cost</h4>
                    </div>

                    <div className="space-y-2">
                      {autoReleaseEnabled && (
                        <div className="p-3 bg-primary/10 rounded-lg mb-2">
                          <div className="flex items-start gap-2">
                            <Icon icon="mdi:information" className="text-primary mt-0.5" />
                            <p className="text-xs text-primary">
                              Auto-release is enabled. Chapters must have a coin price of at least 1 for advanced access.
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={autoReleaseEnabled && !isIndefinitelyLocked ? "1" : "0"}
                        placeholder={autoReleaseEnabled ? "Minimum 1 coin" : "Set Cost"}
                        value={isIndefinitelyLocked ? '0' : coins}
                        onChange={(e) => {
                          if (isIndefinitelyLocked) return; // Prevent changes when indefinitely locked
                          
                          setHasBeenTouched(true);
                          // Only allow numeric input
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          onSettingsChange({ publishAt, coins: value });
                        }}
                        onBlur={(e) => {
                          if (isIndefinitelyLocked) return; // Prevent changes when indefinitely locked
                          
                          setHasBeenTouched(true);
                          let value = parseInt(e.target.value) || 0;
                          // Enforce minimum 1 coin if auto-release is enabled
                          if (autoReleaseEnabled && !isIndefinitelyLocked && value < 1) {
                            value = 1;
                          }
                          onSettingsChange({ publishAt, coins: value.toString() });
                        }}
                        className={`w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isIndefinitelyLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isIndefinitelyLocked ? "Indefinitely locked chapters are always free" : "Set coins required to access this chapter"}
                        disabled={isIndefinitelyLocked}
                      />
                      {coins !== '0' && !isIndefinitelyLocked && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon icon="mdi:information" className="w-3.5 h-3.5" />
                          Readers will need coins for early access
                        </p>
                      )}
                      {isIndefinitelyLocked && (
                        <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
                          <Icon icon="mdi:information" className="w-3.5 h-3.5" />
                          Indefinitely locked chapters cannot be purchased with coins
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-border bg-accent/50">
                <button
                  type="button"
                  onClick={() => {
                    setHasBeenTouched(true);
                    onCloseSchedulePopup?.();
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
                  disabled={isSaving}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setHasBeenTouched(true);
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

      {/* Calendar Modal */}
      {showCalendar && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[70]" 
            onClick={() => setShowCalendar(false)}
          />
          <div className="fixed inset-0 z-[71] flex items-center justify-center pointer-events-none">
            <div className="bg-background rounded-lg shadow-lg pointer-events-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Select Date</h3>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close calendar"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <Calendar
                  onDateSelect={(date) => {
                    const isoString = date.toISOString();
                    handleDateTimeChange('date', isoString.split('T')[0]);
                    setShowCalendar(false);
                  }}
                  advancedDates={advancedDates}
                  minDate={new Date()}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
} 