'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'gray' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      // Check local storage or system preference
      const storedTheme = localStorage.getItem('theme') as Theme;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
      setThemeState(initialTheme);
      
      // Apply theme class to root element
      document.documentElement.classList.remove('light', 'dark', 'blue', 'green', 'gray', 'orange');
      document.documentElement.classList.add(initialTheme);
      
      setIsHydrated(true);
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to light theme if there's an error
      setThemeState('light');
      document.documentElement.classList.remove('light', 'dark', 'blue', 'green', 'gray', 'orange');
      document.documentElement.classList.add('light');
      setIsHydrated(true);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.remove('light', 'dark', 'blue', 'green', 'gray', 'orange');
      document.documentElement.classList.add(newTheme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  // Prevent hydration mismatch by not rendering until client-side theme is determined
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 