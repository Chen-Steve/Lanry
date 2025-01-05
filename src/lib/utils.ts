import { nanoid } from 'nanoid';

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

export const formatDateMDY = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
};

export function formatRelativeDate(date: string | Date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMilliseconds = now.getTime() - targetDate.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  } else {
    return targetDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export const formatRelativeTime = (date: string | Date) => {
  const now = new Date();
  const inputDate = new Date(date);
  
  // Reset time part for accurate day comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  
  const diffTime = today.getTime() - inputDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  const timeStr = inputDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays === 0) {
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  } else {
    return inputDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ` at ${timeStr}`;
  }
};

export function generateChapterSlug(
  chapterNumber: number, 
  partNumber?: number | null,
  volumeNumber?: number | null
): string {
  const parts = [];
  if (volumeNumber) parts.push(`v${volumeNumber}`);
  parts.push(`c${chapterNumber}`);
  if (partNumber) parts.push(`p${partNumber}`);
  return parts.join('-');
}

export function generateNovelSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateUUID(): string {
  return nanoid();
}

export const formatForumDateTime = (date: string | Date) => {
  const now = new Date();
  const inputDate = new Date(date);
  
  // Reset time part for accurate day comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  
  const diffTime = today.getTime() - inputDay.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  const timeStr = inputDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays === 0) {
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  } else {
    return inputDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ` at ${timeStr}`;
  }
};

export const calculateLevel = (totalMinutes: number): number => {
  // Each level requires progressively more time
  // Level 1: 0-60 minutes (1 hour)
  // Level 2: 61-180 minutes (3 hours)
  // Level 3: 181-360 minutes (6 hours)
  // And so on...
  if (totalMinutes <= 60) return 1;
  return Math.floor(Math.log2(totalMinutes / 60) + 2);
}; 