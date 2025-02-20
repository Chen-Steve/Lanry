'use client';

import { Icon } from '@iconify/react';
import { useTheme } from '@/lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="bg-secondary p-2 rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Icon icon="ph:sun-bold" className="w-5 h-5 sm:w-5 sm:h-5" />
      ) : (
        <Icon icon="ph:moon-bold" className="w-5 h-5 sm:w-5 sm:h-5" />
      )}
    </button>
  );
} 