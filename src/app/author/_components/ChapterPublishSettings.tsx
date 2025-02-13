import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { formatLocalDateTime, toLocalDatetimeValue, fromLocalDatetimeValue, isFutureDate } from '@/utils/dateUtils';

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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCloseSchedulePopup} />
          <div className="fixed inset-0 z-[51] flex items-center justify-center pointer-events-none">
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
                            type="datetime-local"
                            value={toLocalDatetimeValue(publishAt)}
                            onChange={(e) => {
                              console.log('Selected datetime:', e.target.value);
                              const newPublishAt = fromLocalDatetimeValue(e.target.value);
                              console.log('Converted to ISO:', newPublishAt);
                              onSettingsChange({
                                publishAt: newPublishAt,
                                coins: newPublishAt ? coins : '0'
                              });
                            }}
                            min={new Date().toISOString().slice(0, 16)}
                            className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-primary relative z-[60] hover:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:text-foreground [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:w-5"
                            style={{ colorScheme: 'dark' }}
                            aria-label="Publication date and time"
                          />
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