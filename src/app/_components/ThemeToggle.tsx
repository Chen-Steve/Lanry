'use client';

import { Icon } from '@iconify/react';
import { useTheme } from '@/lib/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import type { Theme } from '@/lib/ThemeContext';

const themeIcons: Record<Theme, string> = {
  'light': 'ph:sun-bold',
  'dark': 'ph:moon-bold',
  'blue': 'ph:drop-bold',
  'green': 'ph:leaf-bold',
  'gray': 'ph:circle-half-bold',
  'orange': 'ph:sun-bold'
};

const themeNames: Record<Theme, string> = {
  'light': 'Light',
  'dark': 'Dark',
  'blue': 'Blue',
  'green': 'Green',
  'gray': 'Gray',
  'orange': 'Orange'
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary p-2 rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Toggle theme"
      >
        <Icon icon={themeIcons[theme]} className="w-5 h-5 sm:w-5 sm:h-5" />
      </button>

      {isOpen && (
        <div className={`absolute ${isMobile ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-40 bg-card rounded-lg shadow-lg border border-border py-1 z-50`}>
          {Object.entries(themeNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => {
                setTheme(key as Theme);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-accent transition-colors ${
                theme === key ? 'text-primary' : 'text-foreground'
              }`}
            >
              <Icon icon={themeIcons[key as Theme]} className="w-4 h-4" />
              <span>{name}</span>
              {theme === key && (
                <Icon icon="ph:check-bold" className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 