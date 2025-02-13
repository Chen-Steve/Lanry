// Format a date string that includes timezone offset tag [+/-hours]
export function formatLocalDateTime(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Convert a date to local datetime-local value for input
export function toLocalDatetimeValue(date: string | null): string {
  if (!date) return new Date().toISOString().slice(0, 16);
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
  
  // Adjust for timezone offset to show the correct local time
  const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
  const localDate = new Date(d.getTime() + tzOffset);
  
  // Format as YYYY-MM-DDThh:mm in local time
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Convert local datetime-local value to ISO string
export function fromLocalDatetimeValue(localValue: string): string {
  if (!localValue) return '';
  
  // Parse the local datetime value
  const [datePart, timePart] = localValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create a date object in local time
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Convert to UTC by adding the timezone offset (since we want to move forward to UTC)
  const tzOffset = localDate.getTimezoneOffset() * 60000; // offset in milliseconds
  const utcDate = new Date(localDate.getTime() + tzOffset);
  
  return utcDate.toISOString();
}

// Check if a date string represents a future date
export function isFutureDate(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) > new Date();
} 