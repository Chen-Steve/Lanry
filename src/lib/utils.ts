export function formatDate(date: string | Date) {
  const d = new Date(date);
  
  // Format: "January 1, 2024 at 14:00"
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // This will show AM/PM format. Set to false for 24-hour format
  }).replace(',', ' at');
}

export function generateChapterSlug(chapterNumber: number): string {
  return `c${chapterNumber}`;
}

export function generateNovelSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
} 