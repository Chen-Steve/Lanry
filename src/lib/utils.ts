export function formatDate(date: Date | string): string {
  // If date is a string, convert it to Date object
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObject.getTime())) {
    console.error('Invalid date:', date);
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObject);
} 