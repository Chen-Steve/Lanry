// Format a date string that includes timezone offset tag [+/-hours]
export function formatLocalDateTime(date: string | null): string {
  if (!date) return '';
  
  // Extract timezone offset if present and remove it from the date string
  const d = new Date(date.replace(/\[[-+]?\d+\]$/, ''));
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return `${d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimezone
  })} ${userTimezone}`;
}

// Convert a date to local datetime-local value for input
export function toLocalDatetimeValue(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  // Convert to local timezone
  const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
  return localDate.toISOString().slice(0, 16);
}

// Convert local datetime-local value to ISO string while preserving local time
export function fromLocalDatetimeValue(localValue: string): string {
  if (!localValue) return '';
  const d = new Date(localValue);
  // Store the local timezone offset with the date
  const offset = new Date().getTimezoneOffset();
  const localTimezoneTag = `[${-offset/60}]`; // Store UTC offset in hours
  return d.toISOString() + localTimezoneTag;
}

// Check if a date string represents a future date
export function isFutureDate(date: string | null): boolean {
  if (!date) return false;
  return new Date(date.replace(/\[[-+]?\d+\]$/, '')) > new Date();
} 