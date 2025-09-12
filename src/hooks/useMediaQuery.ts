'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    try {
      const media = window.matchMedia(query);
      
      // Update the state initially
      setMatches(media.matches);

      // Create listener
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };

      // Add the listener
      media.addEventListener('change', listener);

      // Clean up
      return () => {
        media.removeEventListener('change', listener);
      };
    } catch (error) {
      console.error('Error in useMediaQuery:', error);
      // Return false as fallback
      return () => {};
    }
  }, [query]);

  return matches;
}
