export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr} ${timeStr}`;
};

export const formatRelativeDate = (date: string | Date) => {
  const now = new Date();
  const inputDate = new Date(date);
  
  // Reset time part for accurate day comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  
  const diffTime = today.getTime() - inputDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return inputDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

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