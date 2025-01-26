'use client';

import { useEffect, useState } from 'react';

interface ChapterCountdownProps {
  publishDate: string;
}

export function ChapterCountdown({ publishDate }: ChapterCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(publishDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [publishDate]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
      {timeLeft.days > 0 && (
        <span>{timeLeft.days}d</span>
      )}
      <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
      <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
      <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
    </div>
  );
} 