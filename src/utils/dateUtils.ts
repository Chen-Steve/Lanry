// Format a date string that includes timezone offset tag [+/-hours]
export function formatLocalDateTime(date: string | null): string {
  if (!date) return '';
  
  // Parse date and time directly from ISO string
  const [datePart, timePart] = date.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  
  // Convert hours to 12-hour format
  const hour = parseInt(hours);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  // Format date using the parsed components
  return `${month}/${day}/${year} ${displayHour}:${minutes} ${period}`;
}

// Convert a date to local datetime-local value for input
export function toLocalDatetimeValue(date: string | null): string {
  if (!date) return '';
  
  // Parse date and time directly from ISO string
  const [datePart, timePart] = date.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours] = timePart.split(':');
  
  return `${year}-${month}-${day}T${hours}:${timePart.split(':')[1]}`;
}

// Store date exactly as selected without timezone conversion
export function fromLocalDatetimeValue(localValue: string): string {
  if (!localValue) return '';
  
  // Parse the local datetime value
  const [datePart, timePart] = localValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date string in ISO format WITHOUT the Z suffix to keep it local
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000`;
}

// Check if a date string represents a future date
export function isFutureDate(date: string | null): boolean {
  if (!date) return false;
  
  // Parse date directly from ISO string
  const [datePart, timePart] = date.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const selectedDate = new Date(year, month - 1, day, hours, minutes);
  return selectedDate > new Date();
} 