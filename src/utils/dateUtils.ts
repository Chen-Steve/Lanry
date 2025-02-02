// Format a date string that includes timezone offset tag [+/-hours]
export function formatLocalDateTime(date: string | null): string {
  if (!date) return '';
  
  const d = new Date(date);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Use a more consistent format that matches the datetime-local input
  const formattedDate = d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimezone
  });
  
  return `${formattedDate} ${userTimezone}`;
}

// Convert a date to local datetime-local value for input
export function toLocalDatetimeValue(date: string | null): string {
  if (!date) {
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return now.toLocaleString('sv', { timeZone: userTimezone }).slice(0, 16);
  }
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      const now = new Date();
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return now.toLocaleString('sv', { timeZone: userTimezone }).slice(0, 16);
    }
    
    // Convert to local date string in YYYY-MM-DDThh:mm format using the user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('sv', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone
    });
    
    return formatter.format(d).replace(' ', 'T');
  } catch {
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return now.toLocaleString('sv', { timeZone: userTimezone }).slice(0, 16);
  }
}

// Convert local datetime-local value to ISO string while preserving local time
export function fromLocalDatetimeValue(localValue: string): string {
  if (!localValue) return '';
  
  // Parse the local datetime value
  const [datePart, timePart] = localValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create a date object in UTC directly with the local time values
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  
  // Get the user's timezone offset in minutes
  const targetDate = new Date(year, month - 1, day, hours, minutes);
  const tzOffset = -targetDate.getTimezoneOffset();
  
  // Adjust the UTC date by the timezone offset to preserve the local time
  const adjustedDate = new Date(utcDate.getTime() - (tzOffset * 60000));
  
  return adjustedDate.toISOString();
}

// Check if a date string represents a future date
export function isFutureDate(date: string | null): boolean {
  if (!date) return false;
  const now = new Date();
  const d = new Date(date);
  return d > now;
} 