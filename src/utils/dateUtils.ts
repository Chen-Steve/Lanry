// Format a date string that includes timezone offset tag [+/-hours]
export function formatLocalDateTime(date: string | null): string {
  if (!date) return '';
  
  const local = new Date(date);

  const year = local.getFullYear();
  const month = (local.getMonth() + 1).toString().padStart(2, '0');
  const day = local.getDate().toString().padStart(2, '0');

  let hours = local.getHours();
  const minutes = local.getMinutes().toString().padStart(2, '0');

  const period = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${month}/${day}/${year} ${hours}:${minutes} ${period}`;
}

// Convert a UTC/ISO date string to a value usable for <input type="datetime-local">
export function toLocalDatetimeValue(date: string | null): string {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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